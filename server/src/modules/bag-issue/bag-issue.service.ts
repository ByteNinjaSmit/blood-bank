import { Types } from 'mongoose';
import { childLogger } from '@/core/logger';
import { withAudit } from '@/shared/utils/with-audit';
import { ConflictError, NotFoundError } from '@/shared/errors';
import type { BagIssueRepo, BagIssueDto } from '@/modules/bag-issue/bag-issue.repository';
import type { BagStockRepo } from '@/modules/bag-stock/bag-stock.repository';
import type {
  CreateBagIssueInput,
  MarkUsedInput,
  ListBagIssueInput,
} from '@/modules/bag-issue/bag-issue.validator';

export interface BagIssueService {
  list(
    q: ListBagIssueInput,
  ): Promise<{ items: BagIssueDto[]; total: number; page: number; pageSize: number }>;
  get(id: string): Promise<BagIssueDto>;
  issue(input: CreateBagIssueInput, actorId: string): Promise<BagIssueDto>;
  markUsed(id: string, input: MarkUsedInput, actorId: string): Promise<BagIssueDto>;
  markReturned(id: string, actorId: string): Promise<BagIssueDto>;
  markDamaged(id: string, actorId: string): Promise<BagIssueDto>;
}

function generateIssueNumber(): string {
  const now = new Date();
  const yyyymmdd = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}`;
  const rand = new Types.ObjectId().toHexString().slice(-4).toUpperCase();
  return `BI-${yyyymmdd}-${rand}`;
}

function generateBagSerial(): string {
  const now = new Date();
  const yyyymmdd = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}`;
  const rand = new Types.ObjectId().toHexString().slice(-6).toUpperCase();
  return `BAG-${yyyymmdd}-${rand}`;
}

export function createBagIssueService(deps: {
  bagIssues: BagIssueRepo;
  bagStock: BagStockRepo;
}): BagIssueService {
  const log = childLogger({ module: 'bag-issue-service' });

  return {
    async list(q) {
      const { items, total } = await deps.bagIssues.list(q);
      return { items, total, page: q.page ?? 1, pageSize: q.pageSize ?? 20 };
    },

    async get(id) {
      const issue = await deps.bagIssues.findById(id);
      if (!issue) throw new NotFoundError('BagIssue', id);
      return issue;
    },

    async issue(input, actorId) {
      const stock = await deps.bagStock.findById(input.stockId);
      if (!stock) throw new NotFoundError('BagStock', input.stockId);
      if (stock.closingStock <= 0) {
        throw new ConflictError(
          `No stock available for BagStock ${input.stockId} (closing stock: ${stock.closingStock})`,
        );
      }
      if (stock.status === 'OUT_OF_STOCK' || stock.status === 'EXPIRED') {
        throw new ConflictError(`BagStock has status ${stock.status} and cannot be issued`);
      }

      const issueNumber = generateIssueNumber();
      const bagSerialNumber = generateBagSerial();

      const created = await deps.bagIssues.create({
        issueNumber,
        issueDate: new Date(),
        stockId: input.stockId,
        bagSerialNumber,
        bagType: stock.bagType,
        batchNumber: stock.batchNumber,
        issuedById: input.issuedById,
        collectionRoom: input.collectionRoom,
        notes: input.notes,
        actorId,
      });

      await deps.bagStock.incrementIssued(input.stockId, 1, actorId);
      log.info({ issueNumber, bagSerialNumber, stockId: input.stockId, actorId }, 'bag issued');
      void withAudit(
        { actorId },
        {
          module: 'bag-issue',
          action: 'CREATE',
          entityType: 'BagIssue',
          entityId: created.id,
          entityLabel: issueNumber,
        },
        undefined,
        { issueNumber, bagSerialNumber, stockId: input.stockId },
      );
      return created;
    },

    async markUsed(id, input, actorId) {
      const issue = await deps.bagIssues.findById(id);
      if (!issue) throw new NotFoundError('BagIssue', id);
      if (issue.status !== 'ISSUED') {
        throw new ConflictError(
          `Bag must be in ISSUED status to mark as used (current: ${issue.status})`,
        );
      }
      const updated = await deps.bagIssues.updateStatus(
        id,
        {
          status: 'USED',
          donorId: input.donorId,
          donationId: input.donationId,
          usedAt: new Date(),
        },
        actorId,
      );
      if (!updated) throw new NotFoundError('BagIssue', id);
      log.info({ issueId: id, actorId }, 'bag marked as used');
      void withAudit(
        { actorId },
        {
          module: 'bag-issue',
          action: 'UPDATE',
          entityType: 'BagIssue',
          entityId: id,
          entityLabel: issue.issueNumber,
        },
        { status: 'ISSUED' },
        { status: 'USED', donorId: input.donorId, donationId: input.donationId },
      );
      return updated;
    },

    async markReturned(id, actorId) {
      const issue = await deps.bagIssues.findById(id);
      if (!issue) throw new NotFoundError('BagIssue', id);
      if (issue.status !== 'ISSUED') {
        throw new ConflictError(
          `Bag must be in ISSUED status to return (current: ${issue.status})`,
        );
      }
      const updated = await deps.bagIssues.updateStatus(
        id,
        {
          status: 'RETURNED',
          returnedAt: new Date(),
        },
        actorId,
      );
      if (!updated) throw new NotFoundError('BagIssue', id);
      // Return the bag to stock
      await deps.bagStock.decrementIssued(issue.stockId, 1, actorId);
      log.info({ issueId: id, stockId: issue.stockId, actorId }, 'bag returned to stock');
      void withAudit(
        { actorId },
        {
          module: 'bag-issue',
          action: 'UPDATE',
          entityType: 'BagIssue',
          entityId: id,
          entityLabel: issue.issueNumber,
        },
        { status: 'ISSUED' },
        { status: 'RETURNED' },
      );
      return updated;
    },

    async markDamaged(id, actorId) {
      const issue = await deps.bagIssues.findById(id);
      if (!issue) throw new NotFoundError('BagIssue', id);
      if (issue.status !== 'ISSUED') {
        throw new ConflictError(
          `Bag must be in ISSUED status to mark as damaged (current: ${issue.status})`,
        );
      }
      const updated = await deps.bagIssues.updateStatus(
        id,
        {
          status: 'DAMAGED',
          damagedAt: new Date(),
        },
        actorId,
      );
      if (!updated) throw new NotFoundError('BagIssue', id);
      // Move from issued to damaged
      await deps.bagStock.decrementIssued(issue.stockId, 1, actorId);
      await deps.bagStock.incrementDamaged(issue.stockId, 1, actorId);
      log.warn({ issueId: id, stockId: issue.stockId, actorId }, 'bag marked as damaged');
      void withAudit(
        { actorId },
        {
          module: 'bag-issue',
          action: 'UPDATE',
          entityType: 'BagIssue',
          entityId: id,
          entityLabel: issue.issueNumber,
          severity: 'warning',
        },
        { status: 'ISSUED' },
        { status: 'DAMAGED' },
      );
      return updated;
    },
  };
}
