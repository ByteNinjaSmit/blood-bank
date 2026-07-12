export function checkAccess(user, moduleAliases = ["admin", "users", "user management", "admin users", "user"]) {
  const normalize = (s = "") => String(s).toLowerCase();
  const isAdmin = user?.role === 'admin' || user?.role === 'system-admin';
  const perms = user?.permissions || [];
  const match = perms.find(p => moduleAliases.some(a => normalize(p.moduleName) === normalize(a)));
  const isBbo = user?.role === 'bbo';
  return {
    isAdmin,
    canView: isAdmin || !!match?.view,
    // Backend restricts POST /user and DELETE /user/:id to system-admin only,
    // and PUT /user/:id to system-admin + bbo (user.routes.ts), so these can't
    // be granted to other roles via the generic permission flags.
    canCreate: isAdmin,
    canUpdate: isAdmin || (isBbo && !!match?.update),
    canDelete: isAdmin,
  };
}
