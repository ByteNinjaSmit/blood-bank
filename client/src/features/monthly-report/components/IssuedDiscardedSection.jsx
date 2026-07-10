import React from 'react';
import { Section, ReportTable, EntityBreakdown } from './ReportTable';

export default function IssuedDiscardedSection({ componentsIssued, discards }) {
  const discardRows = (discards.rows || []).map((r) => [
    r.reason,
    r.quantity,
    Object.entries(r.byProduct)
      .map(([p, q]) => `${p} x${q}`)
      .join(', '),
  ]);

  return (
    <>
      <Section title="2. Blood Components Issued (by Hospital)">
        <EntityBreakdown
          entities={componentsIssued.hospitals}
          emptyLabel="No units issued to any hospital for this period."
        />
        <p className="text-[11px] text-slate-400">
          Sourced from Requisitions matched and issued/completed this period, not the raw inventory issue log.
        </p>
      </Section>
      <Section title="3. Blood Components Discarded (by Reason)">
        <ReportTable headers={['Reason', 'Quantity', 'Component Breakdown']} rows={discardRows} alignRight={[1]} />
        <p className="text-[11px] text-slate-400">
          Sourced from the Discard register (units with status DISCARDED). Units that simply expired in stock
          without being processed through the discard workflow are not counted here.
        </p>
      </Section>
    </>
  );
}
