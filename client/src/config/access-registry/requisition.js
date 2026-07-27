export default {
  id: 'requisition',
  label: 'Requisition',
  pages: [
    { id: 'requisition-manage', label: 'Manage', route: '/requisition', actions: { view: ['requisition:read'], create: ['requisition:create'], update: ['requisition:approve'], delete: ['requisition:reject'] } },
    { id: 'requisition-list', label: 'List', route: '/requisition/list', actions: { view: ['requisition:read'] } },
  ],
};
