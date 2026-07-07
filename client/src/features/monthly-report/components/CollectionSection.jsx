import React from 'react';
import { Section, ReportTable } from './ReportTable';

export default function CollectionSection({ collection }) {
  const rows = [
    ['In Camps', collection.inCamps.male, collection.inCamps.female, collection.inCamps.total],
    ['In Blood Bank', collection.inBloodBank.male, collection.inBloodBank.female, collection.inBloodBank.total],
    ['Grand Total', collection.grandTotal.male, collection.grandTotal.female, collection.grandTotal.total],
  ];

  return (
    <Section title="1 & 2. Voluntary & Replacement Blood Collection">
      <div className="grid grid-cols-3 gap-3 text-sm">
        <Stat label="Number of Camps" value={collection.campsCount} />
        <Stat label="Voluntary Collection (est.)" value={collection.voluntary} />
        <Stat label="Replacement Collection" value={collection.replacement} />
      </div>
      <ReportTable headers={['Location', 'Male', 'Female', 'Total']} rows={rows} alignRight={[1, 2, 3]} />
      <p className="text-[11px] text-slate-400">
        Voluntary/replacement split is inferred from donation type (all non-REPLACEMENT donations counted as
        voluntary) — see Data Availability Notes below.
      </p>
    </Section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
      <div className="text-[11px] text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="text-lg font-semibold text-slate-800">{value ?? 0}</div>
    </div>
  );
}
