export default {
  id: 'audit',
  label: 'Audit Trail',
  pages: [
    { id: 'audit-trail', label: 'Audit Trail', route: '/audit-trail', actions: { view: ['audit:read'] } },
  ],
};
