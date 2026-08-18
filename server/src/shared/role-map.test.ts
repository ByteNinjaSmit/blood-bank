// Locks in the grid → Permission-string projection for the cases that were
// previously ungrantable: an action requiring more than one permission
// string from the same module (e.g. TTI release), and pages where the same
// (moduleName, action) pair means something different than it does
// elsewhere (e.g. Recycle Bin's "delete" = permanent-delete).

import { describe, it, expect } from 'vitest';
import { projectPermissions } from '@/shared/role-map';

describe('projectPermissions', () => {
  it('isFullAccess grants every permission regardless of the grid', () => {
    const perms = projectPermissions(true, []);
    expect(perms).toContain('tti:release');
    expect(perms).toContain('donor:permanent-delete');
  });

  it('TTI create/update earns both tti:edit and tti:release', () => {
    const perms = projectPermissions(false, [{ moduleName: 'tti', create: true, update: true }]);
    expect(perms).toContain('tti:edit');
    expect(perms).toContain('tti:release');
  });

  it('TTI view alone does not earn edit or release', () => {
    const perms = projectPermissions(false, [{ moduleName: 'tti', view: true }]);
    expect(perms).toContain('tti:read');
    expect(perms).not.toContain('tti:edit');
    expect(perms).not.toContain('tti:release');
  });

  it('camp create earns both camp:manage and camp:read', () => {
    const perms = projectPermissions(false, [{ moduleName: 'camp', create: true }]);
    expect(perms).toContain('camp:manage');
    expect(perms).toContain('camp:read');
  });

  it('donor update on the main donor register grants only donor:update, not delete', () => {
    const perms = projectPermissions(false, [
      { moduleName: 'donor', pageId: 'donor-list', update: true },
    ]);
    expect(perms).toContain('donor:update');
    expect(perms).not.toContain('donor:delete');
  });

  it('donor update on Camp Donor Management also grants donor:delete', () => {
    const perms = projectPermissions(false, [
      { moduleName: 'donor', pageId: 'camp-donors', update: true },
    ]);
    expect(perms).toContain('donor:update');
    expect(perms).toContain('donor:delete');
  });

  it('donor create on Donor Creation also grants donor:update and donor:read', () => {
    const perms = projectPermissions(false, [
      { moduleName: 'donor', pageId: 'donor-creation', create: true },
    ]);
    expect(perms).toEqual(expect.arrayContaining(['donor:create', 'donor:update', 'donor:read']));
  });

  it('donor create also works granted module-wide (no pageId) — Donor Creation is the only page that offers it', () => {
    const perms = projectPermissions(false, [{ moduleName: 'donor', create: true }]);
    expect(perms).toEqual(expect.arrayContaining(['donor:create', 'donor:update', 'donor:read']));
  });

  it("Recycle Bin's delete checkbox grants permanent-delete, not the base delete permission", () => {
    const perms = projectPermissions(false, [
      { moduleName: 'donor', pageId: 'mis-recycle-bin', delete: true },
      { moduleName: 'donation', pageId: 'mis-recycle-bin', delete: true },
    ]);
    expect(perms).toContain('donor:permanent-delete');
    expect(perms).toContain('donation:permanent-delete');
  });

  it('a module-wide (non-page-scoped) donor update grant still resolves to the plain default', () => {
    const perms = projectPermissions(false, [{ moduleName: 'donor', update: true }]);
    expect(perms).toContain('donor:update');
    expect(perms).not.toContain('donor:delete');
  });
});
