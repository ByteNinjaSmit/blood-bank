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
    { id: 'mis-recycle-bin', label: 'Recycle Bin', route: '/mis/recycle-bin', actions: { view: ['report:read'], update: ['audit:write'] } },
  ],
};
