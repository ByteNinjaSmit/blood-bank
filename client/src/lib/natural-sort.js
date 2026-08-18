// Natural (human) comparator for bag-number strings like `SBCK26-D-0002` /
// `SBCK26-T-0002`. Operators only care about the trailing sequence number —
// the segment-type letter (D/T) must NOT affect ordering, so this compares
// by the LAST contiguous digit run in the string (e.g. `0002`), not by a
// left-to-right token walk (which would compare the "D" vs "T" letter
// before ever reaching the digits and wrongly group all D's before all T's).
// Falls back to a plain string compare when a string has no trailing digits.
function lastDigitRun(str) {
  const m = str.match(/(\d+)(?!.*\d)/);
  return m ? Number(m[1]) : null;
}

export function compareBagNo(a, b) {
  if (!a || typeof a !== "string" || !b || typeof b !== "string") {
    return a === b ? 0 : a < b ? -1 : 1;
  }

  const aNum = lastDigitRun(a);
  const bNum = lastDigitRun(b);

  if (aNum !== null && bNum !== null) {
    const diff = aNum - bNum;
    if (diff !== 0) return diff;
    return a.localeCompare(b);
  }
  return a.localeCompare(b);
}

// Returns a new array of items sorted ascending by their bag-number field
// (default key `bagNo`), using the natural comparator above.
export function sortByBagNoAsc(items, bagNoKey = "bagNo") {
  return [...items].sort((a, b) => compareBagNo(a[bagNoKey], b[bagNoKey]));
}
