// Stored `componentType` values are already the canonical report codes
// (WB/PRBC/FFP/RDP/CRYO/SDP) post-migration, so no translation is needed.
export const PRODUCTS = ['WB', 'PRBC', 'FFP', 'RDP', 'CRYO', 'SDP'] as const;

export const DISCARD_LABEL: Record<string, string> = {
  EXPIRED: 'Expired',
  BAG_LEAK: 'Leakage / Other',
  HAEMOLYSED: 'Other',
  LIPAEMIC: 'Other',
  CLOTTED: 'Other',
  COLD_CHAIN_BREACH: 'Other',
  CONTAMINATION: 'Other',
  QC_FAIL: 'Other',
  UNUSED_AFTER_THAW: 'Other',
  DONOR_RECALL: 'Other',
  LABEL_ERROR: 'Other',
  UNDERWEIGHT: 'Other',
};
export const TTI_DISCARD_LABEL: Record<string, string> = {
  HIV: 'HIV Positive',
  HBSAG: 'HBsAg Positive',
  HCV: 'HCV',
  SYPHILIS: 'VDRL',
  MALARIA: 'MP',
};

export const DISEASE_KEYWORDS: Array<{ label: string; terms: string[] }> = [
  { label: 'Thalassemia', terms: ['thalassemia', 'thalassaemia'] },
  { label: 'Sickle Cell Anaemia', terms: ['sickle'] },
  {
    label: 'Pregnancy Related Complications',
    terms: ['pregnan', 'obstetric', 'antepartum', 'postpartum'],
  },
  {
    label: 'Cancer',
    terms: ['cancer', 'malignan', 'oncolog', 'leukemia', 'leukaemia', 'lymphoma'],
  },
  { label: 'Haemophilia', terms: ['haemophilia', 'hemophilia'] },
  { label: 'Accident', terms: ['accident', 'trauma', 'rta', 'injury'] },
  { label: 'Anaemia', terms: ['anaemia', 'anemia'] },
  { label: 'Bleeding Piles', terms: ['piles', 'haemorrhoid', 'hemorrhoid'] },
  { label: 'Surgery', terms: ['surgery', 'surgical', 'operation', 'operative'] },
  { label: 'Cardiac', terms: ['cardiac', 'heart'] },
  { label: 'Dialysis', terms: ['dialysis', 'renal failure', 'ckd'] },
  { label: 'Dengue', terms: ['dengue'] },
];

// Requisition.patient.indicationCategory → display label. Mirrors the
// client's INDICATION_CATEGORY_LABELS (requisition/pages/constants.js) —
// kept in sync manually since one is a Mongoose enum-backed value and the
// other a React select option.
export const INDICATION_CATEGORY_LABEL_MAP: Record<string, string> = {
  THALASSEMIA: 'Thalassemia',
  SICKLE_CELL_ANAEMIA: 'Sickle Cell Anemia',
  PREGNANCY_RELATED_COMPLICATION: 'Pregnancy Related Complication',
  CANCER: 'Cancer',
  HAEMOPHILIA: 'Haemophilia',
  ACCIDENT: 'Accident',
  ANEMIA: 'Anemia',
};

// Reason label for the requisition-indication-driven issue breakdown. A
// structured (non-Other) category returns its fixed label; OTHER returns the
// operator-entered free text (or a generic "Other" if left blank); no
// category at all returns "Not Specified".
export function categoryLabel(indicationCategory?: string | null, otherDiseaseName?: string | null): string {
  if (!indicationCategory) return 'Not Specified';
  if (indicationCategory === 'OTHER') return otherDiseaseName?.trim() || 'Other';
  return INDICATION_CATEGORY_LABEL_MAP[indicationCategory] || 'Not Specified';
}

export const REAGENT_CANONICAL = [
  'Anti-A',
  'Anti-B',
  'Anti-D',
  'Anti-AB',
  'Anti-A1',
  'Anti-H',
  'Anti-AHG',
  'Bovine',
];
export const ELISA_CANONICAL = [
  { label: 'HIV ELISA', terms: ['hiv'] },
  { label: 'HBsAg ELISA', terms: ['hbsag', 'hbv'] },
  { label: 'HCV ELISA', terms: ['hcv'] },
  { label: 'MP ELISA', terms: ['mp', 'malaria'] },
  { label: 'VDRL ELISA', terms: ['vdrl', 'syphilis'] },
];

export const GROUP_LABELS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'BBG+', 'BBG-'] as const;
export const STORAGE_CENTRE_PATTERN = /storage/i;

export function toProductLabel(componentType: string): string {
  return (PRODUCTS as readonly string[]).includes(componentType) ? componentType : 'Other';
}

export function toGroupLabel(aboGroup?: string, rhFactor?: string): string {
  if (!aboGroup || !rhFactor) return 'Unknown';
  return `${aboGroup}${rhFactor === 'POSITIVE' ? '+' : '-'}`;
}

export function emptyGroupTally(): Record<string, number> {
  return Object.fromEntries(GROUP_LABELS.map((g) => [g, 0]));
}

export function buildEntityBreakdown(
  entries: Array<{ entity: string; product: string; group: string }>,
): Array<{
  name: string;
  rows: Array<{ product: string; byGroup: Record<string, number>; total: number }>;
  total: number;
}> {
  const byEntity: Record<string, Record<string, Record<string, number>>> = {};
  for (const { entity, product, group } of entries) {
    byEntity[entity] ??= {};
    byEntity[entity]![product] ??= emptyGroupTally();
    const tally = byEntity[entity]![product]!;
    tally[group] = (tally[group] ?? 0) + 1;
  }

  return Object.entries(byEntity)
    .map(([name, products]) => {
      const rows = PRODUCTS.filter((p) => products[p]).map((product) => {
        const byGroup = products[product]!;
        const total = Object.values(byGroup).reduce((a, b) => a + b, 0);
        return { product, byGroup, total };
      });
      const total = rows.reduce((a, r) => a + r.total, 0);
      return { name, rows, total };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function ageAt(dob: Date, at: Date): number {
  let age = at.getFullYear() - dob.getFullYear();
  const m = at.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && at.getDate() < dob.getDate())) age -= 1;
  return age;
}

export function matchIndication(text: string): string {
  const lower = text.toLowerCase();
  for (const { label, terms } of DISEASE_KEYWORDS) {
    if (terms.some((t) => lower.includes(t))) return label;
  }
  return 'Blood Supply Units';
}
