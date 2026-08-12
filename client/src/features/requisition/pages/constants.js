export { COMPONENT_TYPES } from '@/constants/component-types';
export { ABO_GROUPS as BLOOD_GROUPS, RH_VALUES as RH_TYPES } from '@/lib/blood-groups';

export const URGENCY = ['regular', 'urgent'];

export const UNIT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const SEX_TYPES = [
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
  { value: 'O', label: 'Other' },
];

export const INDICATION_CATEGORY_LABELS = {
  THALASSEMIA: 'Thalassemia',
  SICKLE_CELL_ANAEMIA: 'Sickle Cell Anemia',
  PREGNANCY_RELATED_COMPLICATION: 'Pregnancy Related Complication',
  CANCER: 'Cancer',
  HAEMOPHILIA: 'Haemophilia',
  ACCIDENT: 'Accident',
  ANEMIA: 'Anemia',
  OTHER: 'Other',
};
