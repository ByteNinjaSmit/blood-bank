// Each page under Bag Procurement already has its own distinct backend
// resource/permission prefix (vendor/po/grn/bag-stock/bag-inspection/
// bag-issue/bag-discard) — genuinely separable pages, not a shared
// permission being artificially split.
export default {
  id: 'bag-procurement',
  label: 'Bag Procurement',
  pages: [
    { id: 'procurement-po', label: 'Purchase Orders', route: '/procurement/po', actions: { view: ['po:read'], create: ['po:create'], update: ['po:approve'] } },
    { id: 'procurement-grn', label: 'Goods Receipt', route: '/procurement/grn', actions: { view: ['grn:read'], create: ['grn:create'] } },
    { id: 'procurement-inspection', label: 'Bag Inspection', route: '/procurement/inspection', actions: { view: ['bag-inspection:read'], create: ['bag-inspection:create'] } },
    { id: 'procurement-issue', label: 'Bag Issuance', route: '/procurement/issue', actions: { view: ['bag-issue:read'], create: ['bag-issue:create'] } },
    { id: 'procurement-discard', label: 'Bag Discard', route: '/procurement/discard', actions: { view: ['bag-discard:read'], create: ['bag-discard:create'], update: ['bag-discard:approve'] } },
    { id: 'procurement-inventory', label: 'Bag Inventory', route: '/procurement/inventory', actions: { view: ['bag-stock:read'], update: ['bag-stock:update'] } },
  ],
};
