// Generic cascading soft-delete/restore engine. Declarative tree of
// CascadeNodes (see cascade-registry.ts for the actual graphs), walked
// inside a Mongoose transaction — reusing the exact session/transaction
// pattern already established in unit.repository.ts's
// applyEventToDonation (startSession + withTransaction, with a
// non-replica-set fallback for local dev Mongo).
//
// Two entry points:
//   cascadeSoftDelete(rootNode, rootId, actorId, reason) — soft-deletes
//     the root and every descendant, EXCEPT descendants that are
//     "downstream-locked" (already part of a completed workflow), which
//     are marked `affected` instead — never deleted, never renumbered.
//   cascadeRestore(rootNode, rootId, actorId) — restores everything
//     tagged with the same deleteBatchId as the root (both soft-deleted
//     and affected records), running each node's onRestore hook.

import mongoose, { type ClientSession, type Model } from 'mongoose';
import { childLogger } from '@/core/logger';

const log = childLogger({ module: 'cascade-delete' });

export interface CascadeContext {
  actorId: string;
  reason?: string;
  deleteBatchId: string;
  session: ClientSession | null;
  /** Internal — tracks the immediate parent for affectedByModule/affectedByRecord labeling. */
  currentParent?: { name: string; doc: any };
}

export interface CascadeRestoreContext {
  actorId: string;
  deleteBatchId: string;
  session: ClientSession | null;
}

export interface CascadeNode {
  /** Human-readable module name, used for affectedByModule + logging. */
  name: string;
  model: Model<any>;
  /** Field on the CHILD document that links back to the parent. */
  linkField: string;
  linkType: 'objectId' | 'businessId';
  /** Field on the PARENT document holding the business id the child links to (required when linkType='businessId'). */
  parentBusinessIdField?: string;
  children?: CascadeNode[];
  /** Return true if this record already participates in a completed downstream workflow and must be preserved (marked affected, not deleted). */
  isDownstreamLocked?: (doc: any) => boolean;
  /** Inventory/side-effect reversal on soft-delete. Must use atomic $inc, never read-modify-write. */
  onSoftDelete?: (doc: any, ctx: CascadeContext) => Promise<void>;
  /** Inverse of onSoftDelete, run on restore. */
  onRestore?: (doc: any, ctx: CascadeRestoreContext) => Promise<void>;
  /**
   * Replaces the default `$set: {deletedAt,...}` mutation entirely — for
   * records whose identity/number must never be touched even when
   * "deleted" (e.g. BloodUnit, which is only ever moved through its
   * state machine). Must still persist `deleteBatchId` on the document
   * itself so cascadeRestore can find it later.
   */
  customSoftDelete?: (doc: any, ctx: CascadeContext) => Promise<void>;
  /** Replaces the default restore mutation; must clear deleteBatchId itself. */
  customRestore?: (doc: any, ctx: CascadeRestoreContext) => Promise<void>;
}

export function newDeleteBatchId(): string {
  return new mongoose.Types.ObjectId().toHexString();
}

/**
 * Runs `fn` inside a Mongoose session/transaction, falling back to a
 * non-transactional session for local dev Mongo without a replica set
 * (identical fallback strategy to unit.repository.ts applyEventToDonation).
 */
export async function runInCascadeTransaction<T>(
  fn: (session: ClientSession | null) => Promise<T>,
): Promise<T> {
  const session = await mongoose.startSession();
  try {
    try {
      let result: T;
      await session.withTransaction(async () => {
        result = await fn(session);
      });
      return result!;
    } catch (err) {
      // Mirrors unit.repository.ts's applyEventToDonation fallback:
      // don't try to pattern-match every deployment's wording for
      // "transactions unsupported" (standalone dev Mongo, shared-tier
      // Atlas clusters, etc. all phrase it differently) — any failure
      // to run inside a transaction just retries once without a
      // session rather than surfacing a raw 500. A deliberate domain
      // error thrown from within `fn` (e.g. InvalidUnitTransition) is
      // deterministic and will throw the same error again here, so it
      // still propagates correctly as its proper AppError response.
      log.warn(
        { err: (err as Error).message },
        'Cascade transaction failed — retrying without a session',
      );
      return fn(null);
    }
  } finally {
    await session.endSession();
  }
}

export async function cascadeSoftDelete(
  node: CascadeNode,
  rootId: string,
  actorId: string,
  reason: string | undefined,
  deleteBatchId: string,
  session: ClientSession | null,
): Promise<void> {
  const rootDoc = await node.model.findById(rootId).session(session);
  if (!rootDoc) return;
  const ctx: CascadeContext = { actorId, reason, deleteBatchId, session };
  // The root is always the thing the user explicitly chose to delete —
  // its own lock status is never consulted (that's the caller's job,
  // e.g. permanentDelete's guard). forceAffected=false at the root.
  await processNode(node, rootDoc, ctx, false);
}

/**
 * Handles one node (soft-delete or mark-affected) and always recurses
 * into its children — even when the node itself was marked affected,
 * because everything downstream of a preserved record must also be
 * preserved (affected), never independently soft-deleted.
 */
async function processNode(
  node: CascadeNode,
  doc: any,
  ctx: CascadeContext,
  forceAffected: boolean,
): Promise<void> {
  const parent = ctx.currentParent;
  let childrenForceAffected = forceAffected;

  if (forceAffected) {
    await markAffected(node, doc, parent?.name ?? 'upstream', parent?.doc ?? doc, ctx);
  } else if (node.isDownstreamLocked?.(doc)) {
    await markAffected(node, doc, parent?.name ?? 'upstream', parent?.doc ?? doc, ctx);
    childrenForceAffected = true;
  } else {
    if (node.customSoftDelete) {
      await node.customSoftDelete(doc, ctx);
    } else {
      await node.model.updateOne(
        { _id: doc._id },
        {
          $set: {
            deletedAt: new Date(),
            deletedBy: ctx.actorId,
            deleteReason: ctx.reason,
            deleteBatchId: ctx.deleteBatchId,
          },
        },
        { session: ctx.session ?? undefined },
      );
    }
    if (node.onSoftDelete) await node.onSoftDelete(doc, ctx);
  }

  for (const child of node.children ?? []) {
    const linkValue = child.linkType === 'objectId' ? doc._id : doc[child.parentBusinessIdField!];
    if (linkValue === undefined || linkValue === null) continue;

    const matches = await child.model
      .find({ [child.linkField]: linkValue, deletedAt: null, affected: { $ne: true } })
      .session(ctx.session);

    for (const childDoc of matches) {
      await processNode(child, childDoc, { ...ctx, currentParent: { name: node.name, doc } }, childrenForceAffected);
    }
  }
}

async function markAffected(
  node: CascadeNode,
  doc: any,
  parentModuleName: string,
  parentDoc: any,
  ctx: CascadeContext,
): Promise<void> {
  await node.model.updateOne(
    { _id: doc._id },
    {
      $set: {
        affected: true,
        affectedReason: `Upstream ${parentModuleName} record was deleted while this record already participates in a completed workflow`,
        affectedByModule: parentModuleName,
        affectedByRecord: String(parentDoc._id),
        affectedDate: new Date(),
        canAutoRecover: false,
        deleteBatchId: ctx.deleteBatchId,
      },
    },
    { session: ctx.session ?? undefined },
  );
  // Affected records are marked, never deleted — no onSoftDelete hook
  // (identity/inventory numbers are explicitly never touched).
}

export async function cascadeRestore(
  node: CascadeNode,
  rootId: string,
  actorId: string,
  session: ClientSession | null,
): Promise<void> {
  const rootDoc = await node.model.findById(rootId).session(session);
  if (!rootDoc || !rootDoc.deleteBatchId) return;
  const ctx: CascadeRestoreContext = { actorId, deleteBatchId: rootDoc.deleteBatchId, session };
  await restoreBatch(node, ctx);
}

async function restoreBatch(node: CascadeNode, ctx: CascadeRestoreContext): Promise<void> {
  const docs = await node.model.find({ deleteBatchId: ctx.deleteBatchId }).session(ctx.session);

  for (const doc of docs) {
    const wasAffected = Boolean(doc.affected);
    if (node.customRestore) {
      await node.customRestore(doc, ctx);
    } else if (wasAffected) {
      await node.model.updateOne(
        { _id: doc._id },
        {
          $set: { affected: false, canAutoRecover: true },
          $unset: { affectedReason: '', affectedByModule: '', affectedByRecord: '', affectedDate: '', deleteBatchId: '' },
        },
        { session: ctx.session ?? undefined },
      );
    } else {
      await node.model.updateOne(
        { _id: doc._id },
        {
          $set: { deletedAt: null },
          $unset: { deletedBy: '', deleteReason: '', deleteBatchId: '' },
        },
        { session: ctx.session ?? undefined },
      );
    }
    if (node.onRestore) await node.onRestore(doc, ctx);
  }

  for (const child of node.children ?? []) {
    await restoreBatch(child, ctx);
  }
}
