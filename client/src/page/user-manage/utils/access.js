export function checkAccess(user, moduleAliases = ["users","user management","admin users","user"]) {
  const normalize = (s = "") => String(s).toLowerCase();
  const isAdmin = user?.role === 'admin';
  const perms = user?.permissions || [];
  const match = perms.find(p => moduleAliases.some(a => normalize(p.moduleName) === normalize(a)));
  return {
    isAdmin,
    canView: isAdmin || !!match?.view,
    canCreate: isAdmin || !!match?.create,
    canUpdate: isAdmin || !!match?.update,
    canDelete: isAdmin || !!match?.delete,
  };
}
