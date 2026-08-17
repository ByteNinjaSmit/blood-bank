// Data assembly for the printable "Stock Register" report (Stock page ->
// Export Excel -> Export Stocks). Pulls the full in-stock + reserved +
// under-testing (quarantine, TTI still pending) picture in one shot, always
// unfiltered — this is the bank's official stock register, not a view of
// whatever filters happen to be on screen.
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

/**
 * @returns {Promise<{stockGroups: Array, testingGroups: Array}>}
 */
export async function fetchCombinedStockRegister() {
  const [inStockRes, reservedRes, quarantineRes] = await Promise.all([
    inventoryApi.legacyStockByStatus('in-stock'),
    inventoryApi.legacyStockByStatus('reserved'),
    inventoryApi.legacyStockByStatus('quarantine'),
  ]);

  // unwrap() already resolves the `{ success, data }` envelope down to the
  // `data` array itself — see core/api-client.js.
  const inStock = Array.isArray(inStockRes) ? inStockRes : [];
  const reserved = Array.isArray(reservedRes) ? reservedRes : [];
  const quarantine = Array.isArray(quarantineRes) ? quarantineRes : [];

  const combinedRows = [
    ...inStock.map((r) => toRow(r, false)),
    ...reserved.map((r) => toRow(r, true)),
  ];

  return {
    stockGroups: buildPairedGroups(combinedRows),
    // Under Testing: components separated but TTI not yet released — the
    // Stock page's own "quarantine" status filter is exactly this set.
    testingGroups: buildPairedGroups(quarantine.map((r) => toRow(r, false))),
  };
}
