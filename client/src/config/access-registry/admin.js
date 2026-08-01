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
    {
      id: 'manage-roles',
      label: 'Manage Roles',
      route: '/admin/user-manage',
      actions: { view: ['role:read'], create: ['role:create'], update: ['role:update'], delete: ['role:delete'] },
    },
  ],
};
