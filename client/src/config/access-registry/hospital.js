export default {
  id: 'hospital',
  label: 'Hospital',
  pages: [
    { id: 'hospital-add', label: 'Add Hospital', route: '/hospital/add', actions: { create: ['hospital:manage'] } },
    { id: 'hospital-list', label: 'Hospital List', route: '/hospital/list', actions: { view: ['hospital:read'], update: ['hospital:manage'] } },
  ],
};
