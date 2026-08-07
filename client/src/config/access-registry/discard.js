// Top-level clinical (BloodUnit) discard register — distinct from Bag
// Procurement's own discard register (bag-procurement.js), which uses the
// separate `bag-discard:*` permissions.
export default {
  id: 'discard',
  label: 'Discard',
  pages: [
    { id: 'discard-list', label: 'Discard Register', route: '/discard', actions: { view: ['discard:read'], create: ['discard:create', 'donation:read', 'bag-inspection:read'], update: ['discard:restore'] } },
  ],
};
