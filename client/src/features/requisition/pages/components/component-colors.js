// Per-component color themes so each component's box (and its bags / grouping
// / crossmatch sub-boxes) is easy to tell apart at a glance. Colors mirror the
// component palette used on the Inventory/Stock + Dashboard views
// (dashboardExcel.js MATRIX_COMPONENTS): PRBC=rose, FFP=sky, RDP=amber,
// CRYO=indigo, SDP=purple, WB=red. Same component always gets the same color.
//
// Class strings are written out in full (not composed dynamically) so Tailwind
// keeps them during purge.
const THEMES = {
  WB:   { box: 'border-red-300',    header: 'bg-red-100 text-red-900',       tint: 'bg-red-50/50',    accent: 'border-red-200' },
  PRBC: { box: 'border-rose-300',   header: 'bg-rose-100 text-rose-900',     tint: 'bg-rose-50/50',   accent: 'border-rose-200' },
  FFP:  { box: 'border-sky-300',    header: 'bg-sky-100 text-sky-900',       tint: 'bg-sky-50/50',    accent: 'border-sky-200' },
  RDP:  { box: 'border-amber-300',  header: 'bg-amber-100 text-amber-900',   tint: 'bg-amber-50/50',  accent: 'border-amber-200' },
  CRYO: { box: 'border-indigo-300', header: 'bg-indigo-100 text-indigo-900', tint: 'bg-indigo-50/50', accent: 'border-indigo-200' },
  SDP:  { box: 'border-purple-300', header: 'bg-purple-100 text-purple-900', tint: 'bg-purple-50/50', accent: 'border-purple-200' },
};

const DEFAULT_THEME = { box: 'border-gray-300', header: 'bg-gray-100 text-gray-800', tint: 'bg-gray-50/50', accent: 'border-gray-200' };

export function componentColor(componentType) {
  return THEMES[componentType] || DEFAULT_THEME;
}
