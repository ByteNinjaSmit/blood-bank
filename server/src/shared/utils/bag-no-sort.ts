// Shared bag-number comparator. Bag numbers look like `SBCK26-D-0002` /
// `SBCK26-T-0011` — the D/T (segment-type) letter must NEVER influence
// ordering, only the trailing digit run does. A plain natural
// localeCompare would hit that letter before the digits and wrongly
// group all D's ahead of all T's regardless of sequence number.
//
// Used by inventory.legacy-view.repository (Stock list) and
// component.repository (unified near-expiry) so both sort bag numbers
// identically.

/** The last run of digits in the string as a number, or null if none. */
export function lastDigitRun(s: string): number | null {
  const m = s.match(/(\d+)(?!.*\d)/);
  return m ? Number(m[1]) : null;
}

/**
 * Comparator for two bag-number strings. `dir` is 1 for ascending
 * (lowest bag number first), -1 for descending.
 */
export function compareBagNo(aStr: string, bStr: string, dir: 1 | -1 = 1): number {
  const a = String(aStr ?? '');
  const b = String(bStr ?? '');
  const aNum = lastDigitRun(a);
  const bNum = lastDigitRun(b);
  const cmp =
    aNum !== null && bNum !== null && aNum !== bNum
      ? aNum - bNum
      : a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  return cmp * dir;
}
