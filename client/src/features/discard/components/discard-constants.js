import { COMPONENT_LABEL } from "@/constants/component-types";

// Clinical discard reasons — for a bag/segment that held (or holds) blood.
// Mirrors server DISCARD_REASON (minus the system-only CASCADE_DELETED).
export const DISCARD_REASONS = [
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
];

// Empty / unfilled bag discard reasons — the bag never held blood, so the
// clinical vocabulary above doesn't apply. Mirrors server BAG_DISCARD_REASON.
export const BAG_DISCARD_REASONS = [
  'EXPIRED',
  'LEAKAGE',
  'STERILITY_FAILURE',
  'DAMAGED_NEEDLE',
  'BROKEN_SEAL',
  'MANUFACTURING_DEFECT',
  'PHYSICAL_DAMAGE',
  'TEMPERATURE_EXCURSION',
  'QC_FAILURE',
];

// bag-inspection testingType includes two bag-state values (EMPTY/OTHER)
// alongside the 6 canonical component types, so it can't be a straight
// re-export of COMPONENT_LABEL.
export const TESTING_TYPE_LABELS = {
  EMPTY: 'Empty Bag (QC)',
  ...COMPONENT_LABEL,
  OTHER: 'Other',
};

export const PHYSICAL_CHECKS = [
  { key: 'sealIntact', label: 'Seal Intact' },
  { key: 'noLeakage', label: 'No Leakage' },
  { key: 'tubeIntegrity', label: 'Tube Integrity' },
  { key: 'needleCondition', label: 'Needle Condition' },
  { key: 'labelPresence', label: 'Label Presence' },
  { key: 'sterilityCheck', label: 'Sterility Check' },
  { key: 'packagingCondition', label: 'Packaging Condition' },
];
