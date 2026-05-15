export const ModuleArray = [
  "Dashboard",
  "Requisition",
  "Camp",
  "Donor",
  "Donations",
  "Component",
  "Labs",
  "Serology",
  "Inventory",
  "Discard",
  "Queue",
  "Report",
  "Admin",
  "Site",
  "Hospital",
  "MIS",
  "Volunteer"
];

export const RoleArray = [
  "admin",
  "lab-tech",
  "inventory",
  "hospital",
  "viewer",
  "staff"
];

export const checkAccess = (user, name, access) => {
  if (!user || !name || !access) return false;

  const valid = ["view", "create", "update", "delete"];
  if (!valid.includes(access)) return false;

  const perms = Array.isArray(user.permissions) ? user.permissions : [];
  const target = String(name).trim().toLowerCase();

  return perms.some((p) => {
    if (!p || typeof p !== "object") return false;
    const moduleMatch =
      typeof p.moduleName === "string" &&
      p.moduleName.trim().toLowerCase() === target;
    return moduleMatch && p[access] === true;
  });
};
