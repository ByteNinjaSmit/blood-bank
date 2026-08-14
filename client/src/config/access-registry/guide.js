// Software Guide is a static help page — every authenticated user can see
// it regardless of role/permission grid, so its page is alwaysAllowed.
export default {
  id: 'guide',
  label: 'Guide',
  pages: [
    { id: 'software-guide', label: 'Software Guide', route: '/software-guide', alwaysAllowed: true, actions: {} },
  ],
};
