// Per-BloodUnit audit entries for non-clinical stock movements — storage
// transfers and inter-bank loans. These movements flip a unit's status
// (or soft-delete it) outside the formal state machine, so without this
// they leave no row in the audit trail. Shape mirrors the entries
// unit.repository.applyEvent() writes for state-machine transitions:
// entityType 'BloodUnit', entityId = the HUMAN unit id (BloodUnit.unitId,
// e.g. `SBCK26-D-0002`), never the Mongo _id — so the audit-trail "Entity"
// column shows a bag number staff recognise.

import { withAudit } from '@/shared/utils/with-audit';
import type { AuditAction } from '@/shared/enums';

interface UnitMovementAudit {
  actorId: string;
  /** Owning module, e.g. 'storage-transfer' | 'bulk-transfer'. */
  module: string;
  /** BloodUnit.unitId — the human identifier, NOT the Mongo _id. */
  unitId: string;
  /** statusHistory event tag, e.g. 'SEND_TO_STORAGE'. */
  event: string;
  /** Human-readable explanation, reused from the statusHistory reason. */
  reason: string;
  severity?: 'info' | 'warning' | 'critical';
}

/** A unit whose `status` changed (e.g. RELEASED -> ISSUED for a loan). */
export function auditUnitStatusMovement(
  params: UnitMovementAudit & { from: string; to: string },
): void {
  void withAudit(
    { actorId: params.actorId },
    {
      module: params.module,
      action: 'STATE_TRANSITION',
      entityType: 'BloodUnit',
      entityId: params.unitId,
      entityLabel: params.unitId,
      reason: params.reason,
      severity: params.severity,
    },
    { status: params.from },
    { status: params.to, event: params.event },
  );
}

/** A unit created directly in stock (a bag taken in on loan). */
export function auditUnitCreated(params: UnitMovementAudit & { status: string }): void {
  void withAudit(
    { actorId: params.actorId },
    {
      module: params.module,
      action: 'CREATE',
      entityType: 'BloodUnit',
      entityId: params.unitId,
      entityLabel: params.unitId,
      reason: params.reason,
      severity: params.severity,
    },
    undefined,
    { status: params.status, event: params.event },
  );
}

/** A unit soft-deleted / reinstated (a taken-in loan bag pulled or returned). */
export function auditUnitSoftDelete(
  params: UnitMovementAudit & { action: Extract<AuditAction, 'DELETE' | 'UPDATE'>; deleted: boolean },
): void {
  void withAudit(
    { actorId: params.actorId },
    {
      module: params.module,
      action: params.action,
      entityType: 'BloodUnit',
      entityId: params.unitId,
      entityLabel: params.unitId,
      reason: params.reason,
      severity: params.severity ?? (params.deleted ? 'warning' : 'info'),
    },
    { deletedAt: params.deleted ? null : 'set' },
    { deletedAt: params.deleted ? 'set' : null, event: params.event },
  );
}
