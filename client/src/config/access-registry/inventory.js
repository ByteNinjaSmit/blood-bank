export default {
  id: 'inventory',
  label: 'Inventory',
  pages: [
    { id: 'inventory-stock', label: 'Stock', route: '/inventory/stock', actions: { view: ['unit:read'] } },
    { id: 'inventory-reserve', label: 'Reserved Stock', route: '/inventory/reserve', actions: { view: ['unit:read'] } },
    { id: 'inventory-reserve-new', label: 'Reserve Stock', route: '/inventory/reserve/new', actions: { view: ['unit:read', 'requisition:read'], create: ['unit:reserve', 'requisition:create', 'requisition:approve', 'requisition:reject', 'crossmatch:perform'] } },
    { id: 'inventory-issue', label: 'Issue', route: '/inventory/issue', actions: { view: ['unit:read', 'requisition:read', 'bulk-transfer:read'], update: ['unit:issue', 'bulk-transfer:create'] } },
    { id: 'inventory-near-expiry', label: 'Near Expiry', route: '/inventory/near-expiry', actions: { view: ['unit:read'] } },
  ],
};
