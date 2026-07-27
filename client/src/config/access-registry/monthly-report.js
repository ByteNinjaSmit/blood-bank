export default {
  id: 'monthly-report',
  label: 'Monthly Statutory Report',
  pages: [
    { id: 'monthly-report', label: 'Monthly Report', route: '/reports/monthly', actions: { view: ['report:read'], create: ['report:generate'] } },
  ],
};
