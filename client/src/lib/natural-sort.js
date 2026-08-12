// Natural (human) comparator for bag-number strings like `SBCK26-D-0002`,
// where a plain string sort misorders numeric runs (e.g. `SBCK26-D-10`
// would sort before `SBCK26-D-2`). Splits each string into alternating
// digit/non-digit runs and compares them positionally — non-digit runs via
// `localeCompare`, digit runs as numbers.
export function compareBagNo(a, b) {
  if (!a || typeof a !== "string" || !b || typeof b !== "string") {
    return a === b ? 0 : a < b ? -1 : 1;
  }

  const tokenize = (str) => str.match(/(\d+)|(\D+)/g) || [];
  const aTokens = tokenize(a);
  const bTokens = tokenize(b);
  const len = Math.max(aTokens.length, bTokens.length);

  for (let i = 0; i < len; i++) {
    const aTok = aTokens[i];
    const bTok = bTokens[i];

    if (aTok === undefined) return -1;
    if (bTok === undefined) return 1;

    const aIsDigit = /^\d+$/.test(aTok);
    const bIsDigit = /^\d+$/.test(bTok);

    if (aIsDigit && bIsDigit) {
      const diff = Number(aTok) - Number(bTok);
      if (diff !== 0) return diff;
    } else {
      const cmp = aTok.localeCompare(bTok);
      if (cmp !== 0) return cmp;
    }
  }

  return 0;
}

// Returns a new array of items sorted ascending by their bag-number field
// (default key `bagNo`), using the natural comparator above.
export function sortByBagNoAsc(items, bagNoKey = "bagNo") {
  return [...items].sort((a, b) => compareBagNo(a[bagNoKey], b[bagNoKey]));
}
