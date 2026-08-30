// Component Separation reuses BloodUnit permissions (`unit:read`) for its
// list page and the dedicated `component:separate` permission for the
// separation action itself — matches the existing
// LEGACY_MODULE_PERMISSION_OVERRIDES entry in server/src/shared/role-map.ts,
// not a new mapping invented here. Near-expiry now lives under Inventory
// (see inventory.js `inventory-near-expiry`); `/component/near-expiry`
// only redirects there.
export default {
  id: 'component',
  label: 'Component',
  pages: [
    { id: 'component-list', label: 'Components List', route: '/component/list', actions: { view: ['unit:read'], update: ['unit:read'] } },
    { id: 'component-separate', label: 'Component Separation', route: '/component/separate', actions: { view: ['unit:read'], create: ['component:separate'] } },
  ],
};
