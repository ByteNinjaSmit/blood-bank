import React from 'react';
import { Section, ReportTable, NotTracked } from './ReportTable';

export default function TestingAndStockSection({ ttiTesting, ictcReferral, stockLedger, bloodGroupCollection }) {
  const ttiRows = (ttiTesting.rows || []).map((r) => [r.test, r.tested, r.positive]);
  const stockRows = (stockLedger.rows || []).map((r) => [
    r.product,
    r.opening,
    r.collection,
    r.issued,
    r.discard,
    r.closing,
  ]);
  const groupRows = (bloodGroupCollection.rows || []).map((r) => [r.group, r.units]);

  return (
    <>
      <Section title="12. TTI Testing (Tested / Positive)">
        <ReportTable headers={['Test', 'Tested', 'Positive']} rows={ttiRows} alignRight={[1, 2]} />
      </Section>

      <Section title="13. ICTC Referral">
        {ictcReferral.available ? (
          <ReportTable
            headers={['HIV', 'HBsAg', 'HCV', 'VDRL', 'Malaria']}
            rows={[[
              ictcReferral.counts.hiv,
              ictcReferral.counts.hbsag,
              ictcReferral.counts.hcv,
              ictcReferral.counts.vdrl,
              ictcReferral.counts.malaria,
            ]]}
            alignRight={[0, 1, 2, 3, 4]}
          />
        ) : (
          <NotTracked note={ictcReferral.note} />
        )}
      </Section>

      <Section title="14. Blood Collection & Stock Details">
        <ReportTable
          headers={['Product', 'Opening Balance', 'Collection', 'Issued', 'Discard', 'Closing Balance']}
          rows={stockRows}
          alignRight={[1, 2, 3, 4, 5]}
        />
      </Section>

      <Section title="16. Blood Group-wise Collection">
        <ReportTable headers={['Blood Group', 'Units']} rows={groupRows} alignRight={[1]} />
        <div className="text-sm font-medium text-slate-700">Total = {bloodGroupCollection.total}</div>
      </Section>
    </>
  );
}
