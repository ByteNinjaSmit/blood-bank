// Chemical/reagent inventory only has read + a combined manage permission
// server-side (`chemical:read` / `chemical:manage`) — every mutating page
// gates on `chemical:manage`, same as the Camp module.
export default {
  id: 'chemical-inventory',
  label: 'Chemical Inventory',
  pages: [
    { id: 'chemical-dashboard', label: 'Dashboard', route: '/chemical-inventory/dashboard', actions: { view: ['chemical:read'] } },
    { id: 'chemical-master', label: 'Chemical Master', route: '/chemical-inventory/chemicals', actions: { view: ['chemical:read'], update: ['chemical:manage'] } },
    { id: 'chemical-suppliers', label: 'Suppliers', route: '/chemical-inventory/suppliers', actions: { view: ['chemical:read'], update: ['chemical:manage'] } },
    { id: 'chemical-manufacturers', label: 'Manufacturers', route: '/chemical-inventory/manufacturers', actions: { view: ['chemical:read'], update: ['chemical:manage'] } },
    { id: 'chemical-purchase', label: 'Purchase Entry', route: '/chemical-inventory/purchase', actions: { view: ['chemical:read'], create: ['chemical:manage', 'upload:write'] } },
    { id: 'chemical-usage', label: 'Stock Usage', route: '/chemical-inventory/usage', actions: { view: ['chemical:read'], update: ['chemical:manage'] } },
    { id: 'chemical-expiry', label: 'Expiry Monitoring', route: '/chemical-inventory/expiry', actions: { view: ['chemical:read'] } },
    { id: 'chemical-reports', label: 'Reports', route: '/chemical-inventory/reports', actions: { view: ['chemical:read'] } },
    { id: 'chemical-history', label: 'Stock Movement History', route: '/chemical-inventory/history', actions: { view: ['chemical:read'] } },
  ],
};
