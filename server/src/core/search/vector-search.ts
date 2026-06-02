// Search layer with 3-tier fallback:
//   1. Atlas $search (cloud full-text, fastest, relevance-ranked)
//   2. MongoDB $text index (works on any replica set, no Atlas needed)
//   3. Regex scan (last resort, no index — only for tiny collections)
//
// Vector search ($vectorSearch) requires Atlas M10+ with a vector index.
// Index definitions to create in Atlas UI or mongocli:
//
// [FULL-TEXT — donors collection]
// {
//   "name": "donor_search",
//   "analyzer": "lucene.standard",
//   "mappings": {
//     "dynamic": false,
//     "fields": {
//       "name.firstName": [{"type":"string"},{"type":"autocomplete"}],
//       "name.lastName":  [{"type":"string"},{"type":"autocomplete"}],
//       "donorId":        [{"type":"string"}],
//       "phone":          [{"type":"string"}],
//       "email":          [{"type":"string"}]
//     }
//   }
// }
//
// [VECTOR — donors collection]
// {
//   "name": "donor_vector_index",
//   "type": "vectorSearch",
//   "fields": [
//     { "type": "vector", "path": "embedding", "numDimensions": 768, "similarity": "cosine" },
//     { "type": "filter", "path": "bloodGroup" },
//     { "type": "filter", "path": "eligibilityStatus" },
//     { "type": "filter", "path": "deletedAt" }
//   ]
// }

import mongoose from 'mongoose';
import { childLogger } from '@/core/logger';

const log = childLogger({ module: 'core/search' });

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SearchOptions {
  query: string;
  filter?: Record<string, unknown>;
  limit?: number;
  skip?: number;
}

export interface DonorSearchOptions extends SearchOptions {
  bloodGroup?: string;
  rh?: string;
  eligibilityStatus?: string;
  onlyEligible?: boolean;
}

export interface VectorSearchOptions {
  collection: string;
  queryVector: number[];
  numCandidates?: number;
  limit?: number;
  filter?: Record<string, unknown>;
  indexName?: string;
}

export interface SearchResult<T = Record<string, unknown>> {
  items: T[];
  total: number;
  source: 'atlas' | 'text-index' | 'regex';
}

// ─── Generic text search ──────────────────────────────────────────────────────

export async function textSearch(
  collection: string,
  opts: SearchOptions & { indexName?: string; searchFields?: string[] },
): Promise<SearchResult> {
  const { query, filter = {}, limit = 20, skip = 0, indexName = 'default' } = opts;
  const coll = mongoose.connection.collection(collection);

  // Tier 1: Atlas $search
  try {
    const pipeline: object[] = [
      {
        $search: {
          index: indexName,
          text: { query, path: { wildcard: '*' } },
          highlight: { path: { wildcard: '*' } },
        },
      },
    ];
    if (Object.keys(filter).length) pipeline.push({ $match: filter });
    const countPipeline = [...pipeline, { $count: 'total' }];
    pipeline.push(
      { $skip: skip },
      { $limit: limit },
      { $addFields: { _score: { $meta: 'searchScore' } } },
    );

    const [items, countResult] = await Promise.all([
      coll.aggregate(pipeline).toArray(),
      coll.aggregate(countPipeline).toArray(),
    ]);
    return {
      items,
      total: (countResult[0] as { total?: number })?.total ?? items.length,
      source: 'atlas',
    };
  } catch {
    log.debug({ collection, query }, 'atlas $search unavailable, trying $text index');
  }

  // Tier 2: $text index
  try {
    const textFilter = { $text: { $search: query }, ...filter };
    const [items, total] = await Promise.all([
      coll
        .find(textFilter, { projection: { score: { $meta: 'textScore' } } })
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit)
        .toArray(),
      coll.countDocuments(textFilter),
    ]);
    return { items, total, source: 'text-index' };
  } catch {
    log.debug({ collection, query }, '$text index unavailable, falling back to regex');
  }

  // Tier 3: Regex fallback
  const fields = opts.searchFields ?? ['name', 'email', 'phone'];
  const rx = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const rxFilter = { $or: fields.map((f) => ({ [f]: rx })), ...filter };
  const [items, total] = await Promise.all([
    coll.find(rxFilter).skip(skip).limit(limit).toArray(),
    coll.countDocuments(rxFilter),
  ]);
  return { items, total, source: 'regex' };
}

// ─── Donor-specific search ────────────────────────────────────────────────────

export async function searchDonors(opts: DonorSearchOptions): Promise<SearchResult> {
  const filter: Record<string, unknown> = { deletedAt: null };
  if (opts.bloodGroup) filter.bloodGroup = opts.bloodGroup;
  if (opts.rh) filter.rh = opts.rh;
  if (opts.eligibilityStatus) filter.eligibilityStatus = opts.eligibilityStatus;
  if (opts.onlyEligible) filter.eligibilityStatus = 'eligible';
  if (opts.filter) Object.assign(filter, opts.filter);

  return textSearch('donors', {
    query: opts.query,
    filter,
    limit: opts.limit ?? 20,
    skip: opts.skip ?? 0,
    indexName: 'donor_search',
    searchFields: ['name.firstName', 'name.lastName', 'donorId', 'phone', 'email'],
  });
}

// ─── Vector search ────────────────────────────────────────────────────────────

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
      { $addFields: { _vectorScore: { $meta: 'vectorSearchScore' } } },
    ])
    .toArray();
}

export async function searchDonorsByVector(
  queryVector: number[],
  opts: { bloodGroup?: string; eligibilityStatus?: string; limit?: number } = {},
): Promise<unknown[]> {
  const filter: Record<string, unknown> = { deletedAt: null };
  if (opts.bloodGroup) filter.bloodGroup = opts.bloodGroup;
  if (opts.eligibilityStatus) filter.eligibilityStatus = opts.eligibilityStatus;

  return atlasVectorSearch({
    collection: 'donors',
    queryVector,
    numCandidates: Math.max((opts.limit ?? 10) * 15, 150),
    limit: opts.limit ?? 10,
    filter,
    indexName: 'donor_vector_index',
  });
}
