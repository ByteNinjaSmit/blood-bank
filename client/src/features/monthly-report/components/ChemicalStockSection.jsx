import React from 'react';
import { Section, ReportTable } from './ReportTable';

function chemicalRow(r) {
  if (!r.configured) return [r.label, 'Not configured in system', '-', '-', '-', '-'];
  return [r.label, r.opening, r.received, r.used, r.damage, r.closing];
}

function elisaRow(r) {
  if (!r.configured) return [r.label, 'Not configured in system', '-', '-', '-', '-', '-'];
  const perPack = r.unitsPerPack || 96;
  const vialInfo = !r.isVialTracked
    ? '-'
    : r.openBoxVialsRemaining > 0
      ? `${r.closing} boxes (${r.openBoxVialsRemaining} vials in open box)`
      : `${r.closing} boxes (${perPack} vials/box)`;
  return [r.label, r.opening, r.received, r.used, r.damage, r.closing, vialInfo];
}

function vialStatus(b) {
  if (b.packType !== 'VIALS' && b.packType !== 'BOX') return '-';
  const perPack = b.unitsPerPack || 96;
  if (b.openBoxUnitsRemaining != null) return `Open box: ${b.openBoxUnitsRemaining}/${perPack} vials left`;
  return `${perPack} vials/box`;
}

function batchRows(items) {
  const rows = [];
  for (const item of items) {
    if (!item.configured || !item.batches?.length) continue;
    for (const b of item.batches) {
      rows.push([
        item.label,
        b.batchNumber ?? '-',
        b.lotNumber ?? '-',
        b.used ?? 0,
        b.remaining ?? 0,
        vialStatus(b),
      ]);
    }
  }
  return rows;
}

export default function ChemicalStockSection({ chemicalStock, bagStock }) {
  const reagentRows = (chemicalStock.reagentRows || []).map(chemicalRow);
  const elisaRows = (chemicalStock.elisaRows || []).map(elisaRow);
  const reagentBatches = batchRows(chemicalStock.reagentRows || []);
  const elisaBatches = batchRows(chemicalStock.elisaRows || []);

  const bagRows = (bagStock.rows || []).map((r) => [r.bagType, r.opening, r.received, r.used, r.damage, r.closing]);
  const bagBatchRows = (bagStock.rows || []).flatMap((r) =>
    (r.batches || []).map((b) => [r.bagType, b.batchNumber, b.opening, b.received, b.used, b.damage, b.closing]),
  );

  return (
    <>
      <Section title="18. Blood Grouping Chemicals Stock">
        <ReportTable
          headers={['Chemical', 'Opening', 'Received', 'Used', 'Damage', 'Closing']}
          rows={reagentRows}
          alignRight={[1, 2, 3, 4, 5]}
        />
        {reagentBatches.length > 0 && (
          <ReportTable
            headers={['Chemical', 'Batch No.', 'Lot No.', 'Used', 'Remaining', 'Vial Status']}
            rows={reagentBatches}
            alignRight={[3, 4]}
          />
        )}
      </Section>

      <Section title="19a. ELISA Kits Stock">
        <ReportTable
          headers={['Kit', 'Opening', 'Received', 'Used', 'Damage', 'Closing', 'Remaining Boxes & Vials']}
          rows={elisaRows}
          alignRight={[1, 2, 3, 4, 5]}
        />
        {elisaBatches.length > 0 && (
          <ReportTable
            headers={['Kit', 'Batch No.', 'Lot No.', 'Used', 'Remaining', 'Vial Status']}
            rows={elisaBatches}
            alignRight={[3, 4]}
          />
        )}
      </Section>

      <Section title="19b. Blood Bag Stock (by Batch)">
        <ReportTable
          headers={['Bag Type', 'Opening', 'Received', 'Used', 'Damage', 'Closing']}
          rows={bagRows}
          alignRight={[1, 2, 3, 4, 5]}
        />
        {bagBatchRows.length > 0 && (
          <ReportTable
            headers={['Bag Type', 'Batch No.', 'Opening', 'Received', 'Used', 'Damage', 'Closing']}
            rows={bagBatchRows}
            alignRight={[2, 3, 4, 5, 6]}
          />
        )}
        <p className="text-[11px] text-slate-400">
          Bag register values are lifetime batch totals (opening/received/used/damage/closing as tracked per batch),
          not re-derived per calendar month.
        </p>
      </Section>
    </>
  );
}
