// Vector / full-text search layer.
//
// Atlas Vector Search index must be created on the collection before use.
// Atlas Search index definition (donor collection):
//
//   {
//     "name": "donor_vector_index",
//     "type": "vectorSearch",
//     "fields": [
//       { "type": "vector", "path": "embedding", "numDimensions": 768, "similarity": "cosine" },
//       { "type": "filter", "path": "bloodGroup" },
//       { "type": "filter", "path": "eligibilityStatus" }
//     ]
//   }
//
// Atlas Search (text) index for keyword search on donors:
//
//   {
//     "name": "donor_search",
//     "analyzer": "lucene.standard",
//     "mappings": {
//       "dynamic": false,
//       "fields": {
//         "name": { "type": "string" },
//         "email": { "type": "string" },
//         "phone": { "type": "string" },
//         "donorId": { "type": "string" }
//       }
//     }
//   }
//
// Local / non-Atlas fallback uses MongoDB $text search (requires text index).

import mongoose from 'mongoose';
import { logger } from '@/core/logger';

const log = logger.child({ module: 'core/search' });

export interface TextSearchOptions {
  collection: string;
  query: string;
  filter?: Record<string, unknown>;
  limit?: number;
  indexName?: string;
}

export interface VectorSearchOptions {
  collection: string;
  queryVector: number[];
  numCandidates?: number;
  limit?: number;
  filter?: Record<string, unknown>;
  indexName?: string;
}

export async function atlasTextSearch(opts: TextSearchOptions): Promise<unknown[]> {
  const { collection, query, filter = {}, limit = 20, indexName = 'default' } = opts;
  try {
    const coll = mongoose.connection.collection(collection);
    return await coll
      .aggregate([
        {
          $search: {
            index: indexName,
            text: { query, path: { wildcard: '*' } },
          },
        },
        ...(Object.keys(filter).length ? [{ $match: filter }] : []),
        { $limit: limit },
        { $addFields: { score: { $meta: 'searchScore' } } },
      ])
      .toArray();
  } catch (err) {
    log.warn(
      { err: (err as Error).message, collection },
      'atlas text search failed, falling back to regex',
    );
    return fallbackTextSearch({ collection, query, filter, limit });
  }
}

export async function atlasVectorSearch(opts: VectorSearchOptions): Promise<unknown[]> {
  const {
    collection,
    queryVector,
    numCandidates = 150,
    limit = 20,
    filter = {},
    indexName = 'donor_vector_index',
  } = opts;
  const coll = mongoose.connection.collection(collection);
  return coll
    .aggregate([
      {
        $vectorSearch: {
          index: indexName,
          path: 'embedding',
          queryVector,
          numCandidates,
          limit,
          ...(Object.keys(filter).length ? { filter } : {}),
        },
      },
      { $addFields: { vectorScore: { $meta: 'vectorSearchScore' } } },
    ])
    .toArray();
}

async function fallbackTextSearch(opts: TextSearchOptions): Promise<unknown[]> {
  const { collection, query, filter = {}, limit = 20 } = opts;
  const coll = mongoose.connection.collection(collection);
  const rx = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  return coll
    .find({
      $or: [{ 'name.first': rx }, { 'name.last': rx }, { email: rx }, { phone: rx }],
      ...filter,
    })
    .limit(limit)
    .toArray();
}
