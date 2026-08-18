// Data assembly for the printable "Stock Register" reports (Stock page ->
// Export Excel -> Export Stocks PRBC / FFP / RDP). Pulls the full stock +
// reserved (+ under-testing, for PRBC/FFP) picture in one shot, always
// unfiltered by whatever's on screen — this is the bank's official stock
// register for that component type.
import { inventoryApi } from './api';
import { buildPairedGroups } from '@/utils/stockRegisterGrouping';

const toRow = (r, isReserved) => ({
  bagNo: r?.bag?.bagNo || r.bagNo,
  bloodGroup: r?.bag?.bloodGroup,
  rh: r?.bag?.rh,
  collectionDate: r?.bag?.donationDate,
  expiryDate: r?.component?.expiryDate,
  isReserved,
});

// unwrap() already resolves the `{ success, data }` envelope down to the
// `data` array itself — see core/api-client.js.
const asArray = (res) => (Array.isArray(res) ? res : []);

/**
 * @param {object} config
 * @param {string} config.componentType - 'PRBC' | 'FFP' | 'RDP'
 * @param {boolean} [config.includeTesting=true] - include the Under Testing (TTD pending) section
 * @param {number} [config.minRows=5] - minimum padded rows per group in the Stock section
 * @param {number} [config.bbgMinRows] - BBG-specific minimum rows override for the Stock section
 * @returns {Promise<{stockGroups: Array, testingGroups: Array}>}
 */
export async function fetchStockRegister({ componentType, includeTesting = true, minRows = 5, bbgMinRows } = {}) {
  const calls = [
    inventoryApi.legacyStockByStatus('in-stock', componentType),
    inventoryApi.legacyStockByStatus('reserved', componentType),
  ];
  if (includeTesting) calls.push(inventoryApi.legacyStockByStatus('quarantine', componentType));

  const [inStockRes, reservedRes, quarantineRes] = await Promise.all(calls);
  const inStock = asArray(inStockRes);
  const reserved = asArray(reservedRes);
  const quarantine = includeTesting ? asArray(quarantineRes) : [];

  const combinedRows = [
    ...inStock.map((r) => toRow(r, false)),
    ...reserved.map((r) => toRow(r, true)),
  ];

  const minRowsByGroup = bbgMinRows != null ? { BBG: bbgMinRows } : {};

  return {
    stockGroups: buildPairedGroups(combinedRows, { minRows, minRowsByGroup }),
    // Under Testing (TTD test pending): components separated but TTI/TTD
    // testing not yet released — always a flat 1-row-minimum per group.
    testingGroups: includeTesting
      ? buildPairedGroups(quarantine.map((r) => toRow(r, false)), { minRows: 1 })
      : [],
  };
}
