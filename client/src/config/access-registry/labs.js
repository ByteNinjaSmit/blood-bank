// Serology entry mutates TTI results (`tti:edit`); the results register is
// read-only (`tti:read`).
export default {
  id: 'labs',
  label: 'Labs',
  pages: [
    { id: 'labs-serology', label: 'TTD Testing', route: '/labs/ttd', actions: { view: ['tti:read'], create: ['tti:edit', 'tti:release'], update: ['tti:edit', 'tti:release'] } },
    { id: 'labs-serology-results', label: 'TTD Testing Results', route: '/labs/ttd-testing', actions: { view: ['tti:read'], update: ['tti:edit', 'tti:release'] } },
  ],
};
