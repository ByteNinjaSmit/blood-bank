// Shared blood-group-paired register layout used by both the printable
// Stock Register report and its matching Excel export: every ABO group gets
// a Positive column and a Negative column, serial-numbered, padded to equal
// length (minimum 5 rows) so an operator can hand-write extra entries.

export const REPORT_BLOOD_GROUPS = ['A', 'B', 'AB', 'O', 'BBG'];

// Mirrors the server's bagNo comparator (inventory.legacy-view.repository.ts)
// so the register's serial ordering matches what "Sort By: Bag Number" shows
// on screen — compare by the trailing digit run, not a left-to-right string
// compare, so a segment-type letter (…-D-0002 vs …-T-0002) never reorders
// bags out of collection sequence.
function lastDigitRun(s) {
  const m = String(s ?? '').match(/(\d+)(?!.*\d)/);
  return m ? Number(m[1]) : null;
}

export function bagNoCompare(a, b) {
  const aStr = String(a ?? '');
  const bStr = String(b ?? '');
  const aNum = lastDigitRun(aStr);
  const bNum = lastDigitRun(bStr);
  if (aNum !== null && bNum !== null && aNum !== bNum) return aNum - bNum;
  return aStr.localeCompare(bStr, undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * @param {Array<{bagNo:string, bloodGroup:string, rh:'Positive'|'Negative', collectionDate?:string, expiryDate?:string, isReserved?:boolean}>} rows
 * @returns {Array<{group:string, positive:Array, negative:Array, rowCount:number}>}
 */
export function buildPairedGroups(rows) {
  const byGroup = {};
  REPORT_BLOOD_GROUPS.forEach((g) => {
    byGroup[g] = { positive: [], negative: [] };
  });

  (rows || []).forEach((r) => {
    const bucket = byGroup[r.bloodGroup];
    if (!bucket) return;
    (r.rh === 'Positive' ? bucket.positive : bucket.negative).push(r);
  });

  return REPORT_BLOOD_GROUPS.map((group) => {
    const positiveSorted = [...byGroup[group].positive].sort((a, b) => bagNoCompare(a.bagNo, b.bagNo));
    const negativeSorted = [...byGroup[group].negative].sort((a, b) => bagNoCompare(a.bagNo, b.bagNo));
    const rowCount = Math.max(positiveSorted.length, negativeSorted.length, 5);

    const pad = (arr) => {
      const out = arr.map((item, i) => ({ ...item, serial: i + 1, empty: false }));
      for (let i = arr.length; i < rowCount; i++) out.push({ serial: i + 1, empty: true });
      return out;
    };

    return { group, positive: pad(positiveSorted), negative: pad(negativeSorted), rowCount };
  });
}
