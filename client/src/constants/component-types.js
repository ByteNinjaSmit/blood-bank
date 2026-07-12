// Canonical blood component type vocabulary.
// Single source of truth for componentType values/labels across the frontend.
// Values MUST match the backend COMPONENT_TYPE enum exactly.
export const COMPONENT_TYPES = [
  { value: 'WB', label: 'Whole Blood' },
  { value: 'PRBC', label: 'Packed Red Blood Cells' },
  { value: 'FFP', label: 'Fresh Frozen Plasma' },
  { value: 'RDP', label: 'Random Donor Platelets' },
  { value: 'SDP', label: 'Single Donor Platelets' },
  { value: 'CRYO', label: 'Cryoprecipitate' },
];

export const COMPONENT_LABEL = Object.fromEntries(COMPONENT_TYPES.map(c => [c.value, c.label]));

// Longer legal/print-style names used on certificates, invoices and labels.
export const COMPONENT_PRINT_LABEL = {
  WB: 'Whole Blood',
  PRBC: 'Packed Red Blood Cells I.P',
  FFP: 'Fresh Frozen Plasma',
  RDP: 'Random Donor Platelets',
  SDP: 'Single Donor Platelets',
  CRYO: 'Cryoprecipitate',
};
