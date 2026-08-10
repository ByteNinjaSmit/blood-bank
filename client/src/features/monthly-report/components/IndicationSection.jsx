import React from 'react';
import { Section, ReportTable, EntityBreakdown } from './ReportTable';

export default function IndicationSection({ issueByIndication, bagsToStorageCentres }) {
  const products = [...new Set((issueByIndication.rows || []).flatMap((r) => Object.keys(r.byProduct)))];
  const headers = ['Indication', ...products, 'Total'];
  const rows = (issueByIndication.rows || []).map((r) => {
    const total = Object.values(r.byProduct).reduce((a, b) => a + b, 0);
    return [r.indication, ...products.map((p) => r.byProduct[p] ?? 0), total];
  });

  const structured = issueByIndication.structuredDiseaseCounts || {
    thalassemia: { count: 0, byBloodGroup: {} },
    sickleCellAnaemia: { count: 0, byBloodGroup: {} },
  };
  const diseaseBreakdownRows = [
    ...Object.entries(structured.thalassemia.byBloodGroup || {}).map(([bg, n]) => ['Thalassemia', bg, n]),
    ...Object.entries(structured.sickleCellAnaemia.byBloodGroup || {}).map(([bg, n]) => ['Sickle Cell Anaemia', bg, n]),
  ];

  // Requisition-driven reason breakdown: every reason from the Clinical
  // Indication / Disease Patients dropdown (plus any custom "Other" text the
  // operator typed), with issued-component counts per reason. Cells with no
  // issued units show "-" rather than 0.
  const byCategory = issueByIndication.byIndicationCategory || { rows: [] };
  const categoryProducts = [...new Set((byCategory.rows || []).flatMap((r) => Object.keys(r.byProduct)))];
  const categoryHeaders = ['Reason', ...categoryProducts, 'Total'];
  const categoryRows = (byCategory.rows || []).map((r) => {
    const total = Object.values(r.byProduct).reduce((a, b) => a + b, 0);
    return [r.reason, ...categoryProducts.map((p) => r.byProduct[p] || '-'), total];
  });

  return (
    <>
      <Section title="14. Blood Bags Given to Blood Storage Centres">
        <EntityBreakdown
          entities={bagsToStorageCentres.centres}
          emptyLabel='No hospital record with "storage" in its name (e.g. "SJS Storage") received units this period.'
        />
        <p className="text-[11px] text-slate-400">
          Storage centres are identified by hospital records whose name contains "storage" — there is no dedicated
          storage-centre entity in the system.
        </p>
      </Section>

      <Section title="15. Component Issue by Clinical Indication / Disease">
        <div className="flex gap-6 text-sm font-medium text-slate-700">
          <span>Thalassemia = {structured.thalassemia.count}</span>
          <span>Sickle Cell Anaemia = {structured.sickleCellAnaemia.count}</span>
        </div>
        <ReportTable
          headers={['Disease', 'Blood Group', 'Units']}
          rows={diseaseBreakdownRows}
          alignRight={[2]}
        />
        <p className="text-[11px] text-slate-400">
          Structured counts sourced directly from the Thalassemia / Sickle Cell Anaemia clinical-indication issue
          flow. The grid below is auto-categorized from the requisition's free-text indication/diagnosis field —
          verify before statutory submission.
        </p>
        <ReportTable headers={headers} rows={rows} alignRight={headers.map((_, i) => i).filter((i) => i > 0)} />
      </Section>

      <Section title="16. Component Issue by Requisition Reason for Transfusion">
        <p className="text-[11px] text-slate-400">
          Every reason from the requisition's Indication for Transfusion dropdown (including any custom "Other"
          text entered), with issued-component counts. "-" means that reason had no issued units of that
          component in this period.
        </p>
        <ReportTable
          headers={categoryHeaders}
          rows={categoryRows}
          alignRight={categoryHeaders.map((_, i) => i).filter((i) => i > 0)}
        />
      </Section>
    </>
  );
}
