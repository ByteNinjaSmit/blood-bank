import React from 'react';
import { Section, ReportTable, NotTracked } from './ReportTable';

export default function DonorStatsSection({
  repeatedDonors,
  donorTesting,
  rejectedDonors,
  donorCounselling,
  bulkTransfer,
  donorCards,
}) {
  const rejectedRows = (rejectedDonors.rows || []).map((r) => [
    r.reason,
    `Male ${r.male} + Female ${r.female} = ${r.total}`,
  ]);

  return (
    <>
      <Section title="5. Repeated Donors">
        <ReportTable
          headers={['Male', 'Female', 'Total']}
          rows={[[repeatedDonors.male, repeatedDonors.female, repeatedDonors.total]]}
          alignRight={[0, 1, 2]}
        />
      </Section>

      <Section title="6. Donor Counselling Before Donation">
        {donorCounselling.available ? (
          <div className="text-sm font-medium text-slate-700">Total Donor Counselling = {donorCounselling.count}</div>
        ) : (
          <NotTracked note={donorCounselling.note} />
        )}
      </Section>

      <Section title="7. Bulk Transfer (Loan Given / Taken)">
        <NotTracked note={bulkTransfer.note} />
      </Section>

      <Section title="10. Rejected / Deferred Donors (Reason-wise)">
        <ReportTable headers={['Reason', 'Count']} rows={rejectedRows} />
        <div className="text-sm font-medium text-slate-700">Total Deferred = {rejectedDonors.total}</div>
        <p className="text-[11px] text-slate-400">
          Sourced from Deferral records raised during donor screening — bucketed by keyword match on the deferral
          reason / source.
        </p>
      </Section>

      <Section title="11. Donor Testing Totals">
        <ReportTable
          headers={['Male', 'Female', 'Total']}
          rows={[[donorTesting.male, donorTesting.female, donorTesting.total]]}
          alignRight={[0, 1, 2]}
        />
      </Section>

      <Section title="15. Voluntary Donor Cards Issued">
        <div className="text-sm font-medium text-slate-700">Total Donor Cards Issued = {donorCards.totalCount ?? 0}</div>
        <ReportTable
          headers={['Component', 'Blood Group', 'Rh', 'Units']}
          rows={(donorCards.breakdown || []).map((b) => [b.componentType, b.bloodGroup, b.rh, b.count])}
          alignRight={[3]}
        />
      </Section>
    </>
  );
}
