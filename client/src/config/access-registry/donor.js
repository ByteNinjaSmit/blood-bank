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
    // Submitting this form also creates a Donation record (always) and a
    // Deferral record (unfit-donor branch, gated on donor:update per
    // deferral.routes.ts) — all three must be granted together or the
    // second/third POST 403s after the first succeeds.
    // bag-stock:read is deliberately NOT listed here — it's a
    // server-only DEPENDENCY_ONLY_PERMISSIONS grant (role-map.ts) that's
    // excluded from the client's effective-permission set on purpose, so
    // requiring it here would make this page invisible to everyone.
    { id: 'donor-creation', label: 'Donor Creation', route: '/master-register/donor-creation', actions: { create: ['donor:create', 'donation:create', 'donor:update', 'donor:read'] } },
  ],
};
