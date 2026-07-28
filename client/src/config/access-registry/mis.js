// MIS report pages are all read-only views over the shared reporting
// engine (`report:read`) — there's no per-report backend permission today,
// consistent with how they're gated server-side. Recycle Bin additionally
// supports restoring soft-deleted records (`audit:write`).
const misPage = (id, label, route) => ({ id, label, route, actions: { view: ['report:read'] } });

export default {
  id: 'mis',
  label: 'MIS',
  pages: [
    misPage('mis-donors', 'Donor MIS', '/mis/donors'),
    misPage('mis-donations', 'Donation MIS', '/mis/donations'),
    misPage('mis-camps', 'Camp MIS', '/mis/camps'),
    misPage('mis-bags', 'Blood Bag MIS', '/mis/bags'),
    misPage('mis-components', 'Component MIS', '/mis/components'),
    misPage('mis-inventory', 'Inventory MIS', '/mis/inventory'),
    misPage('mis-issues', 'Issue MIS', '/mis/issues'),
    misPage('mis-discards', 'Discard MIS', '/mis/discards'),
    misPage('mis-testing', 'Testing MIS', '/mis/testing'),
    misPage('mis-exceptions', 'Exception MIS', '/mis/exceptions'),
    misPage('mis-regulatory', 'Regulatory MIS', '/mis/regulatory'),
    misPage('mis-executive', 'Executive Dashboard', '/mis/executive'),
    misPage('mis-analytics', 'Analytics MIS', '/mis/analytics'),
    // Recycle Bin surfaces soft-deleted records from every module and can
    // restore or permanently delete them — its view/update actions must
    // cover every underlying resource's read/delete permission, not just
    // the shared report:read used by the other MIS pages.
    {
      id: 'mis-recycle-bin',
      label: 'Recycle Bin',
      route: '/recycle-bin',
      actions: {
        // hospital:read and camp:read are deliberately omitted — both are
        // server-only DEPENDENCY_ONLY_PERMISSIONS grants (role-map.ts),
        // excluded from the client's effective set, so listing either here
        // would block this whole action for everyone instead of just
        // gating hospital/camp recycle-bin rows.
        view: ['report:read', 'donor:read', 'donation:read', 'bulk-transfer:read', 'unit:read', 'audit:read'],
        update: ['donor:delete', 'donation:delete', 'hospital:manage', 'camp:manage', 'bulk-transfer:update', 'unit:read'],
        delete: ['donor:permanent-delete', 'donation:permanent-delete', 'hospital:manage', 'camp:manage'],
      },
    },
  ],
};
