// Adverse-reaction service. Records the reaction, marks the
// transfusion, audits, and emails an acknowledgement to the MO.

import { Types } from 'mongoose';
import { childLogger } from '@/core/logger';
import { auditService } from '@/modules/audit/audit.service';
import { notificationService } from '@/modules/notification/notification.service';
import type {
  AdverseReactionDto,
  AdverseReactionRepo,
  CreateReactionInput,
} from './adverse-reaction.repository';
import type { TransfusionRepo } from '@/modules/transfusion/transfusion.repository';

export interface ReportReactionInput extends Omit<CreateReactionInput, 'reactionId'> {
  notifyEmail?: string;
}

export interface AdverseReactionService {
  report(input: ReportReactionInput, actorId: string): Promise<AdverseReactionDto>;
  list(page: number, pageSize: number): Promise<{ items: AdverseReactionDto[]; total: number }>;
}

export function createAdverseReactionService(deps: {
  reactions: AdverseReactionRepo;
  transfusions: TransfusionRepo;
}): AdverseReactionService {
  const log = childLogger({ module: 'adverse-reaction-service' });

  return {
    async report(input, actorId) {
      const reactionId = `AR-${dateStamp()}-${rand()}`;
      const created = await deps.reactions.create({ ...input, reactionId }, actorId);

      // Flag the transfusion so reporting/registers reflect the reaction.
      await deps.transfusions.markReaction(input.transfusionId, actorId).catch(() => undefined);

      await auditService.record({
        actorId,
        action: 'CREATE',
        entityType: 'AdverseReaction',
        entityId: reactionId,
        after: { category: input.category, severity: input.severity, unitId: input.unitId },
      });

      if (input.notifyEmail) {
        await notificationService.send({
          type: 'ADVERSE_REACTION_ACK',
          to: input.notifyEmail,
          payload: {
            reactionId,
            category: input.category,
            severity: input.severity,
            transfusionId: input.transfusionId,
          },
        });
      }

      log.warn(
        { reactionId, category: input.category, severity: input.severity, unitId: input.unitId },
        'adverse reaction reported',
      );
      return created;
    },

    async list(page, pageSize) {
      return deps.reactions.list(page, pageSize);
    },
  };
}

function dateStamp(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
}
function rand(): string {
  return new Types.ObjectId().toHexString().slice(-6).toUpperCase();
}
