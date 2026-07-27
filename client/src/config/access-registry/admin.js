export default {
  id: 'admin',
  label: 'Admin',
  pages: [
    {
      id: 'user-manage',
      label: 'User Management',
      route: '/admin/user-manage',
      actions: { view: ['user:read'], create: ['user:create'], update: ['user:update'], delete: ['user:deactivate'] },
    },
  ],
};
