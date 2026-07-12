// Keep in sync with the sidebar's MODULES list (client/src/components/layout/Sidebar.jsx)
// and the module names checked via checkAccess() across the app (e.g. Home.jsx).
// Only modules that actually exist and are routed belong here.
export const ModuleArray = [
  "Dashboard",
  "Admin",
  "Requisition",
  "Hospital",
  "Camp",
  "Component",
  "Labs",
  "Inventory",
  "Master Register",
  "Donor",
  "Donations",
  "Bag Procurement",
  "Chemical Inventory",
  "Appointment",
  "MIS",
  "Discard",
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
