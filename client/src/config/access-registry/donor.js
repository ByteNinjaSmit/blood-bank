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
    // Bag-first (Inward Donation) entry point into the same wizard, plus its
    // resume list. Walks POST /inward, PATCH /link-donor,
    // PATCH /medical-history and PATCH /finalize (donation:create +
    // donation:update), plus GET /:id when resuming a deep link
    // (donation:read) — all behind this page's single "create" checkbox,
    // mirrored server-side by PAGE_PERMISSION_OVERRIDES['donation-inward']
    // in role-map.ts (no additional role restriction per the product
    // decision recorded in donation.routes.ts).
    { id: 'donation-inward', label: 'Inward Donation', route: '/master-register/donation-inward', actions: { create: ['donor:create', 'donation:create', 'donation:update', 'donation:read', 'donor:update', 'donor:read'] } },
    { id: 'inward-donations-list', label: 'Incomplete Inward Donations', route: '/master-register/inward-donations', actions: { view: ['donation:read'] } },
  ],
};
