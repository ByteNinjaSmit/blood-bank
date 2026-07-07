import React from 'react';
import { Section, ReportTable, EntityBreakdown } from './ReportTable';

export default function IndicationSection({ issueByIndication, bagsToStorageCentres }) {
  const products = [...new Set((issueByIndication.rows || []).flatMap((r) => Object.keys(r.byProduct)))];
  const headers = ['Indication', ...products, 'Total'];
  const rows = (issueByIndication.rows || []).map((r) => {
    const total = Object.values(r.byProduct).reduce((a, b) => a + b, 0);
    return [r.indication, ...products.map((p) => r.byProduct[p] ?? 0), total];
  });

  return (
    <>
      <Section title="8. Blood Bags Given to Blood Storage Centres">
        <EntityBreakdown
          entities={bagsToStorageCentres.centres}
          emptyLabel='No hospital record with "storage" in its name (e.g. "SJS Storage") received units this period.'
        />
        <p className="text-[11px] text-slate-400">
          Storage centres are identified by hospital records whose name contains "storage" — there is no dedicated
          storage-centre entity in the system.
        </p>
      </Section>

      <Section title="9 & 17. Component Issue by Clinical Indication / Disease">
        <ReportTable headers={headers} rows={rows} alignRight={headers.map((_, i) => i).filter((i) => i > 0)} />
        <p className="text-[11px] text-slate-400">
          Auto-categorized from the requisition's free-text indication/diagnosis field — verify before statutory
          submission.
        </p>
      </Section>
    </>
  );
}
