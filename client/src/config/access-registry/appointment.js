export default {
  id: 'appointment',
  label: 'Appointment',
  pages: [
    { id: 'appointment-donors', label: 'Donor Appointments', route: '/appointments/donors', actions: { view: ['appointment:read'], update: ['appointment:update'] } },
    { id: 'appointment-camps', label: 'Camp Donor Appointments', route: '/appointments/camps', actions: { view: ['appointment:read', 'camp:read'], update: ['appointment:update'] } },
  ],
};
