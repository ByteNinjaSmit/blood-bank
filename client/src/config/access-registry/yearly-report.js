export default {
  id: 'yearly-report',
  label: 'Yearly Statutory Report',
  pages: [
    { id: 'yearly-report', label: 'Yearly Report', route: '/reports/yearly', actions: { view: ['report:read'], create: ['report:generate'] } },
  ],
};
