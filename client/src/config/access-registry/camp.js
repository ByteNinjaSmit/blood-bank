// Camp only has one mutation-shaped backend permission (`camp:manage`) —
// create/update pages both gate on it; there's no split create vs update
// permission server-side to map onto separately.
export default {
  id: 'camp',
  label: 'Camp',
  pages: [
    { id: 'camp-registration', label: 'Camp Registration', route: '/camp-registration', actions: { create: ['camp:manage', 'camp:read'] } },
    { id: 'camp-listing', label: 'Camp Listing', route: '/camp-listing', actions: { view: ['camp:read'], update: ['camp:manage'] } },
    { id: 'camp-details', label: 'Camp Details', route: '/camp-details', actions: { view: ['camp:read', 'donor:read', 'donation:read'] } },
    // Donor create/update/delete here go through the shared donor.routes.ts
    // permissions, not a camp-specific one — camp:read/camp:manage alone
    // left the Donor Creation form's dropdowns/actions blocked.
    { id: 'camp-donors', label: 'Camp Donor Management', route: '/camp-donors', actions: { view: ['camp:read', 'donor:read'], create: ['donor:create'], update: ['donor:update', 'donor:delete'] } },
    { id: 'camp-donation', label: 'Camp Donation Management', route: '/camp-donation', actions: { view: ['camp:read', 'donation:read'], update: ['camp:manage'], delete: ['donation:delete'] } },
    { id: 'camp-reports', label: 'Camp Reports', route: '/camp-reports', actions: { view: ['camp:read', 'report:read'] } },
  ],
};
