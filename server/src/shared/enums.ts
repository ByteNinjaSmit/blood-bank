// Centralised enums. Stored as const arrays so we get both a runtime
// list (for validation) and a literal union type (for compile-time
// exhaustiveness checks in switch statements).

export const ROLE = [
  'system-admin',
  'bbo', // Blood Bank Officer (licence holder, release authority)
  'medical-officer',
  'counsellor',
  'phlebotomist',
  'lab-tech-component',
  'lab-tech-serology',
  'store-keeper',
  'issue-counter',
  'apheresis-tech',
  'qa-manager',
  'auditor',
  'camp-organiser',
  'hospital-user',
] as const;
export type Role = (typeof ROLE)[number];

export const PERMISSION = [
  // Donor
  'donor:read',
  'donor:create',
  'donor:update',
  'donor:delete',
  'donor:permanent-delete',
  // Donation
  'donation:read',
  'donation:create',
  'donation:update',
  'donation:delete',
  'donation:permanent-delete',
  // BloodUnit
  'unit:read',
  'unit:create',
  'unit:release',
  'unit:reserve',
  'unit:issue',
  'unit:return',
  'unit:discard',
  // TTI
  'tti:read',
  'tti:edit',
  'tti:release',
  // Component separation
  'component:separate',
  // Requisition + crossmatch + issue
  'requisition:read',
  'requisition:create',
  'requisition:approve',
  'requisition:reject',
  'crossmatch:perform',
  'crossmatch:override',
  // Transfusion + adverse reaction
  'transfusion:record',
  'adverse-reaction:record',
  // Lookback + audit
  'lookback:run',
  'audit:read',
  'audit:export',
  // Reports + MIS
  'report:read',
  'report:generate',
  // Users + roles
  'user:read',
  'user:create',
  'user:update',
  'user:deactivate',
  // ── Blood Bag Procurement & Stock Management ──
  'vendor:read',
  'vendor:create',
  'vendor:update',
  'vendor:delete',
  'vendor:permanent-delete',
  'po:read',
  'po:create',
  'po:approve',
  'po:permanent-delete',
  'grn:read',
  'grn:create',
  'bag-stock:read',
  'bag-stock:update',
  'bag-inspection:read',
  'bag-inspection:create',
  'bag-issue:read',
  'bag-issue:create',
  'bag-discard:read',
  'bag-discard:create',
  'bag-discard:approve',
  'bulk-transfer:read',
  'bulk-transfer:create',
  'bulk-transfer:delete',
  // Appointments (public-site form submissions)
  'appointment:read',
  'appointment:update',
  // In-app notification center
  'notification:read',
  'notification:manage',
] as const;
export type Permission = (typeof PERMISSION)[number];

// ── Blood Bag Procurement ────────────────────────────────────────────────────

export const BAG_TYPE = ['SINGLE', 'DOUBLE', 'TRIPLE', 'QUADRUPLE'] as const;
export type BagType = (typeof BAG_TYPE)[number];

export const BAG_CAPACITY_ML = [350, 450] as const;
export type BagCapacityMl = (typeof BAG_CAPACITY_ML)[number];

export const ANTICOAGULANT = ['CPDA_1', 'CPD', 'ACD', 'SAG_MANNITOL'] as const;
export type Anticoagulant = (typeof ANTICOAGULANT)[number];

export const VENDOR_STATUS = ['PENDING', 'APPROVED', 'SUSPENDED', 'BLACKLISTED'] as const;
export type VendorStatus = (typeof VENDOR_STATUS)[number];

export const PO_STATUS = [
  'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'FULFILLED', 'CANCELLED',
] as const;
export type PoStatus = (typeof PO_STATUS)[number];

export const GRN_STATUS = ['PENDING', 'ACCEPTED', 'PARTIALLY_ACCEPTED', 'REJECTED'] as const;
export type GrnStatus = (typeof GRN_STATUS)[number];

export const INSPECTION_DECISION = ['ACCEPTED', 'REJECTED', 'QUARANTINE'] as const;
export type InspectionDecision = (typeof INSPECTION_DECISION)[number];

export const BAG_STOCK_STATUS = ['AVAILABLE', 'LOW', 'OUT_OF_STOCK', 'EXPIRED'] as const;
export type BagStockStatus = (typeof BAG_STOCK_STATUS)[number];

export const BAG_ISSUE_STATUS = ['ISSUED', 'USED', 'RETURNED', 'DAMAGED'] as const;
export type BagIssueStatus = (typeof BAG_ISSUE_STATUS)[number];

export const BAG_DISCARD_REASON = [
  'EXPIRED', 'LEAKAGE', 'STERILITY_FAILURE', 'DAMAGED_NEEDLE',
  'BROKEN_SEAL', 'MANUFACTURING_DEFECT', 'PHYSICAL_DAMAGE',
  'TEMPERATURE_EXCURSION', 'QC_FAILURE',
] as const;
export type BagDiscardReason = (typeof BAG_DISCARD_REASON)[number];

// ── ABO / Rh ─────────────────────────────────────────────────────────────────

export const ABO_GROUP = ['O', 'A', 'B', 'AB'] as const;
export type AboGroup = (typeof ABO_GROUP)[number];

export const RH_FACTOR = ['POSITIVE', 'NEGATIVE'] as const;
export type RhFactor = (typeof RH_FACTOR)[number];

// Canonical component-type codes. IRRADIATED_PRBC/WASHED_PRBC/LEUKOREDUCED_PRBC
// (former separate component types) collapse into plain PRBC + the matching
// SpecialNeed flag (irradiated/washed/leukoreduced) — see shared/component-type.ts.
export const COMPONENT_TYPE = ['WB', 'PRBC', 'FFP', 'RDP', 'CRYO'] as const;
export type ComponentType = (typeof COMPONENT_TYPE)[number];

export const UNIT_STATUS = [
  'COLLECTED',
  'IN_TESTING',
  'QUARANTINE',
  'RELEASED',
  'RESERVED',
  'CROSSMATCHED',
  'ISSUED',
  'TRANSFUSED',
  'RETURNED_UNUSED',
  'DISCARDED',
  'EXPIRED',
] as const;
export type UnitStatus = (typeof UNIT_STATUS)[number];

export const DONATION_TYPE = [
  'WHOLE_BLOOD',
  'PLASMAPHERESIS',
  'DOUBLE_RED_CELL',
  'AUTOLOGOUS',
  'DIRECTED',
  'REPLACEMENT',
] as const;
export type DonationType = (typeof DONATION_TYPE)[number];

export const DEFERRAL_TYPE = ['TEMPORARY', 'PERMANENT'] as const;
export type DeferralType = (typeof DEFERRAL_TYPE)[number];

export const SPECIAL_NEED = [
  'IRRADIATED',
  'CMV_NEGATIVE',
  'LEUKOREDUCED',
  'WASHED',
  'HBS_NEGATIVE',
  'PHENOTYPE_MATCHED',
] as const;
export type SpecialNeed = (typeof SPECIAL_NEED)[number];

export const DISCARD_REASON = [
  'EXPIRED',
  'TTI_POSITIVE',
  'UNDERWEIGHT',
  'HAEMOLYSED',
  'LIPAEMIC',
  'CLOTTED',
  'BAG_LEAK',
  'COLD_CHAIN_BREACH',
  'CONTAMINATION',
  'QC_FAIL',
  'UNUSED_AFTER_THAW',
  'DONOR_RECALL',
  'LABEL_ERROR',
] as const;
export type DiscardReason = (typeof DISCARD_REASON)[number];

export const CLINICAL_DISEASE = ['THALASSEMIA', 'SICKLE_CELL_ANAEMIA', 'OTHER'] as const;
export type ClinicalDisease = (typeof CLINICAL_DISEASE)[number];

export const TTI_TEST = [
  'HIV',
  'HBSAG',
  'HCV',
  'SYPHILIS',
  'MALARIA',
  // Optional / future:
  'HTLV',
  'NAT_HIV',
  'NAT_HCV',
  'NAT_HBV',
] as const;
export type TtiTest = (typeof TTI_TEST)[number];

export const TTI_RESULT = ['NEGATIVE', 'REACTIVE', 'INDETERMINATE'] as const;
export type TtiResult = (typeof TTI_RESULT)[number];

export const ADVERSE_REACTION_CATEGORY = [
  'FNHTR', // febrile non-haemolytic
  'ALLERGIC',
  'ANAPHYLACTIC',
  'AHTR', // acute haemolytic
  'DHTR', // delayed haemolytic
  'TRALI', // transfusion-related acute lung injury
  'TACO', // transfusion-associated circulatory overload
  'BACTERIAL', // bacterial contamination / sepsis
  'PTP', // post-transfusion purpura
  'TA_GVHD', // graft-versus-host disease
  'HYPOTENSIVE',
  'OTHER',
] as const;
export type AdverseReactionCategory = (typeof ADVERSE_REACTION_CATEGORY)[number];

export const ADVERSE_REACTION_SEVERITY = [
  'GRADE_1', // mild
  'GRADE_2', // moderate
  'GRADE_3', // severe / life-threatening
  'GRADE_4', // death
] as const;
export type AdverseReactionSeverity = (typeof ADVERSE_REACTION_SEVERITY)[number];

export const TRANSFUSION_OUTCOME = ['COMPLETED', 'STOPPED_REACTION', 'STOPPED_OTHER'] as const;
export type TransfusionOutcome = (typeof TRANSFUSION_OUTCOME)[number];

export const AUDIT_ACTION = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'STATE_TRANSITION',
  'RELEASE',
  'RESERVE',
  'ISSUE',
  'DISCARD',
  'OVERRIDE',
  'LOGIN',
] as const;
export type AuditAction = (typeof AUDIT_ACTION)[number];

export const NOTIFICATION_TYPE = [
  'DONOR_WELCOME',
  'DONATION_THANK_YOU',
  'DONOR_DEFERRED',
  'DONOR_BIRTHDAY',
  'TTI_REACTIVE_ALERT',
  'NEAR_EXPIRY_ALERT',
  'DISCARD_REPORT',
  'MONTHLY_MIS_REPORT',
  'REQUISITION_ISSUED',
  'ADVERSE_REACTION_ACK',
  'LOOKBACK_RECALL',
  'LOGIN_OTP',
  'REGISTER_OTP',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPE)[number];

// ── In-app Notification Center ─────────────────────────────────────────────
// Distinct from NOTIFICATION_TYPE above (which drives outbound email
// templates). These back the persisted, per-user in-app notification feed.

export const NOTIFICATION_SEVERITY = ['CRITICAL', 'WARNING', 'INFORMATION', 'SUCCESS'] as const;
export type NotificationSeverity = (typeof NOTIFICATION_SEVERITY)[number];

export const NOTIFICATION_MODULE = [
  'DONOR',
  'COLLECTION',
  'COMPONENT_SEPARATION',
  'TTI_TESTING',
  'INVENTORY',
  'CROSSMATCH',
  'ISSUE_BLOOD',
  'APPOINTMENTS',
  'EQUIPMENT',
  'ADMINISTRATION',
  'OTHERS',
] as const;
export type NotificationModule = (typeof NOTIFICATION_MODULE)[number];

export const NOTIFICATION_CATEGORY = [
  // Critical
  'LOW_STOCK',
  'ZERO_STOCK',
  'EXPIRED_INVENTORY',
  'EQUIPMENT_ISSUE',
  'TTI_REACTIVE',
  'CROSSMATCH_FAILED',
  // Warning
  'NEAR_EXPIRY',
  'DEFERRAL_REMOVED',
  'COMPONENT_SEPARATION_PENDING',
  'COMPONENT_SEPARATION_OVERDUE',
  'TTI_TESTING_PENDING',
  'TTI_TESTING_OVERDUE',
  'CROSSMATCH_PENDING',
  'RESERVATION_EXPIRED',
  // Information
  'APPOINTMENT_BOOKED',
  'APPOINTMENT_CANCELLED',
  'APPOINTMENT_APPROVED',
  'APPOINTMENT_REMINDER',
  'DONATION_COMPLETED',
  'COLLECTION_CANCELLED',
  'COLLECTION_PENDING',
  'NEW_DONOR_REGISTERED',
  'DONOR_RECORD_UPDATED',
  'DONOR_ELIGIBLE_AGAIN',
  'RARE_DONOR_AVAILABLE',
  'BLOOD_UNIT_ADDED',
  'INVENTORY_UPDATED',
  'STOCK_SUMMARY',
  'EMERGENCY_ISSUE',
  'RESERVATION_CREATED',
  // Success
  'TESTING_COMPLETED',
  'COMPONENT_SEPARATION_COMPLETED',
  'CROSSMATCH_COMPLETED',
  'BLOOD_ISSUED',
  'TASK_COMPLETED',
] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORY)[number];

// Compile-time exhaustiveness helper.
export function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}
