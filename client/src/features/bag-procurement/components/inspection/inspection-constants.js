export const DECISION_BADGE = {
  ACCEPTED: 'bg-green-50 text-green-700 border-green-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  QUARANTINE: 'bg-orange-50 text-orange-700 border-orange-200',
};

export const TESTING_TYPE_LABELS = {
  EMPTY: 'Empty Blood Bag',
  WB: 'Whole Blood (WB)',
  PRBC: 'Packed Red Blood Cells (PRBC / PCV)',
  FFP: 'Fresh Frozen Plasma (FFP)',
  RDP: 'Random Donor Platelets (RDP)',
  CRYO: 'Cryoprecipitate',
  OTHER: 'Other Blood Bag',
};

export const PHYSICAL_CHECKS = [
  { key: 'sealIntact', label: 'Seal Intact' },
  { key: 'noLeakage', label: 'No Leakage' },
  { key: 'tubeIntegrity', label: 'Tube Integrity' },
  { key: 'needleCondition', label: 'Needle Condition OK' },
  { key: 'labelPresence', label: 'Label Present' },
  { key: 'sterilityCheck', label: 'Sterility Check' },
  { key: 'packagingCondition', label: 'Packaging Condition' },
];
