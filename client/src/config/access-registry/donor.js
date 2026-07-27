// Master Register — the exact example from the feature request: a
// module-wide "read" grant must show All Donors / All Donations read-only
// and hide Donor Creation entirely (it only supports `create`, which a
// read-only grant never includes).
export default {
  id: 'donor',
  label: 'Master Register',
  pages: [
    { id: 'donor-list', label: 'All Donors', route: '/master-register/donors', actions: { view: ['donor:read'], update: ['donor:update'], delete: ['donor:delete'] } },
    { id: 'donation-list', label: 'All Donations', route: '/master-register/donations', actions: { view: ['donation:read'], update: ['donation:update'], delete: ['donation:delete'] } },
    { id: 'donor-creation', label: 'Donor Creation', route: '/master-register/donor-creation', actions: { create: ['donor:create'] } },
  ],
};
