export default {
  id: 'appointment',
  label: 'Appointment',
  pages: [
    { id: 'appointment-donors', label: 'Donor Appointments', route: '/appointments/donors', actions: { view: ['appointment:read'], update: ['appointment:update'] } },
    // camp:read is deliberately omitted — it's a server-only
    // DEPENDENCY_ONLY_PERMISSIONS grant (role-map.ts), excluded from the
    // client's effective set, so requiring it here would block this page
    // for everyone instead of just gating actual Camp module access.
    { id: 'appointment-camps', label: 'Camp Donor Appointments', route: '/appointments/camps', actions: { view: ['appointment:read'], update: ['appointment:update'] } },
    // Feedback has its own backend module (feedback:read) but is grouped
    // under the Appointments nav section client-side, so it reuses
    // appointment:read here — the sidebar only gates whole nav sections by
    // one permission (see Sidebar.jsx's NAV_ID_TO_REGISTRY_MODULE), so a
    // separate registry module would desync the lock icon from the actual
    // route guard.
    { id: 'appointment-feedback', label: 'Public Feedback', route: '/appointments/feedback', actions: { view: ['appointment:read'] } },
  ],
};
