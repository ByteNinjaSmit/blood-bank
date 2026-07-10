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
  "Appointment",
  "Bag Procurement",
  "Chemical Inventory",
  "Master Register"
];

export const RoleArray = [
  "system-admin",
  "bbo",
  "medical-officer",
  "counsellor",
  "phlebotomist",
  "lab-tech-component",
  "lab-tech-serology",
  "store-keeper",
  "issue-counter",
  "apheresis-tech",
  "qa-manager",
  "auditor",
  "camp-organiser",
  "hospital-user"
];

export const checkAccess = (user, name, access) => {
  if (!user || !name || !access) return false;

  const valid = ["view", "create", "update", "delete"];
  if (!valid.includes(access)) return false;

  if (user.role === 'admin' || user.role === 'system-admin' || user.role === 'bbo') return true;

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
