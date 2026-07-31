// Each page under Bag Procurement already has its own distinct backend
// resource/permission prefix (vendor/po/grn/bag-stock/bag-inspection/
// bag-issue/bag-discard) — genuinely separable pages, not a shared
// permission being artificially split.
export default {
  id: 'bag-procurement',
  label: 'Bag Procurement',
  pages: [
    { id: 'procurement-po', label: 'Purchase Orders', route: '/procurement/po', actions: { view: ['po:read', 'vendor:read'], create: ['po:create', 'vendor:create'], update: ['po:approve'] } },
    { id: 'procurement-grn', label: 'Goods Receipt', route: '/procurement/grn', actions: { view: ['grn:read', 'po:read', 'vendor:read'], create: ['grn:create', 'upload:write'] } },
    { id: 'procurement-inspection', label: 'Bag Inspection', route: '/procurement/inspection', actions: { view: ['bag-inspection:read', 'grn:read', 'donation:read'], create: ['bag-inspection:create', 'upload:write'] } },
    { id: 'procurement-issue', label: 'Bag Issuance', route: '/procurement/issue', actions: { view: ['bag-issue:read', 'unit:read'], create: ['bag-issue:create'] } },
    // bag-stock:read (used for the closing-stock lookup on this page) is
    // a server-only DEPENDENCY_ONLY_PERMISSIONS grant — deliberately
    // excluded from the client set, so it's not listed as required here.
    { id: 'procurement-discard', label: 'Bag Discard', route: '/procurement/discard', actions: { view: ['bag-discard:read'], create: ['bag-discard:create'], update: ['bag-discard:approve'] } },
    { id: 'procurement-inventory', label: 'Bag Inventory', route: '/procurement/inventory', actions: { view: ['bag-stock:read'], update: ['bag-stock:update'] } },
  ],
};
