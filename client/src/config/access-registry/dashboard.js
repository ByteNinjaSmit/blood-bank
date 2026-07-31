// Dashboard is always reachable — no permission grant needed, matching
// nav-modules.jsx's `always: true` on the Dashboard entry today.
export default {
  id: 'dashboard',
  label: 'Dashboard',
  pages: [
    { id: 'home', label: 'Home', route: '/', alwaysAllowed: true },
    { id: 'dashboard', label: 'Dashboard', route: '/dashboard', alwaysAllowed: true },
  ],
};
