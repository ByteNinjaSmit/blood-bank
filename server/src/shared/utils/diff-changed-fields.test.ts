import { describe, it, expect } from 'vitest';
import { diffChangedFields } from './diff-changed-fields';

describe('diffChangedFields', () => {
  it('lists only keys that actually changed on UPDATE', () => {
    const before = { status: 'RESERVED', bloodGroup: 'O+', expiryDate: '2026-01-01' };
    const after = { status: 'ISSUED', bloodGroup: 'O+', expiryDate: '2026-02-01' };
    expect(diffChangedFields(before, after).sort()).toEqual(['expiryDate', 'status'].sort());
  });

  it('treats every key in after as changed on CREATE (before is undefined)', () => {
    expect(diffChangedFields(undefined, { a: 1, b: 2 }).sort()).toEqual(['a', 'b']);
  });

  it('treats every key in before as changed on DELETE (after is undefined)', () => {
    expect(diffChangedFields({ a: 1, b: 2 }, undefined).sort()).toEqual(['a', 'b']);
  });

  it('returns empty array when nothing changed', () => {
    const same = { a: 1, b: 'x' };
    expect(diffChangedFields(same, { ...same })).toEqual([]);
  });

  it('returns empty array when both before and after are absent', () => {
    expect(diffChangedFields(undefined, undefined)).toEqual([]);
  });
});
