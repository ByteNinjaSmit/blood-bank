// Shared serology-grading constants (kept separate from components so
// Fast Refresh stays happy).

// Agglutination grading options. Values mirror the backend GRADING_REACTION
// enum; labels are what the operator reads.
export const GRADING_OPTIONS = [
  { value: 'NEG_0', label: 'Neg (0)' },
  { value: 'POS_1', label: '+1' },
  { value: 'POS_2', label: '+2' },
  { value: 'POS_3', label: '+3' },
  { value: 'POS_4', label: '+4' },
  { value: 'H', label: 'H (Hemolysis)' },
  { value: 'MF', label: 'MF (Mixed Field)' },
];

export const GRADING_LABELS = GRADING_OPTIONS.reduce((m, o) => {
  m[o.value] = o.label;
  return m;
}, {});

export const COMPATIBILITY_RESULT_LABELS = {
  MAJOR_COMPATIBLE: 'Major Compatible',
  MINOR_COMPATIBLE: 'Minor Compatible',
  UNIVERSAL: 'Universal',
};
