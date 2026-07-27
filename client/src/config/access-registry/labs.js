// Serology entry mutates TTI results (`tti:edit`); the results register is
// read-only (`tti:read`).
export default {
  id: 'labs',
  label: 'Labs',
  pages: [
    { id: 'labs-serology', label: 'Serology', route: '/labs/serology', actions: { view: ['tti:read'], create: ['tti:edit'], update: ['tti:edit'] } },
    { id: 'labs-serology-results', label: 'Serology Results', route: '/labs/serology-results', actions: { view: ['tti:read'] } },
  ],
};
