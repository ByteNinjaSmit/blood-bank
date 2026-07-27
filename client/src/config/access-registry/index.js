// Canonical module → page registry — the single source of truth for what
// modules/pages exist and which backend Permission strings gate each of a
// page's actions (view/create/update/delete). Replaces three previously
// drifted, hand-maintained lists: nav-modules.jsx's decorative
// `permissions` field, atoms/static.js's `ModuleArray`, and Home.jsx's
// `rawBloodBankCapabilities`.
import dashboard from './dashboard';
import camp from './camp';
import component from './component';
import discard from './discard';
import inventory from './inventory';
import bagProcurement from './bag-procurement';
import chemicalInventory from './chemical-inventory';
import audit from './audit';
import monthlyReport from './monthly-report';
import labs from './labs';
import donor from './donor';
import appointment from './appointment';
import admin from './admin';
import hospital from './hospital';
import requisition from './requisition';
import mis from './mis';

export const ACCESS_MODULES = [
  dashboard,
  camp,
  component,
  discard,
  inventory,
  bagProcurement,
  chemicalInventory,
  audit,
  monthlyReport,
  labs,
  donor,
  appointment,
  admin,
  hospital,
  requisition,
  mis,
];

export function findModule(moduleId) {
  return ACCESS_MODULES.find((m) => m.id === moduleId) || null;
}

export function findPage(moduleId, pageId) {
  const mod = findModule(moduleId);
  if (!mod) return null;
  return mod.pages.find((p) => p.id === pageId) || null;
}

// Union of every action any page in the module supports — drives which
// checkbox columns the module-level row in the admin UI shows.
export function getModuleActions(moduleId) {
  const mod = findModule(moduleId);
  if (!mod) return [];
  const actions = new Set();
  for (const page of mod.pages) {
    Object.keys(page.actions || {}).forEach((a) => actions.add(a));
  }
  return [...actions];
}
