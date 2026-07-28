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
  ],
};
