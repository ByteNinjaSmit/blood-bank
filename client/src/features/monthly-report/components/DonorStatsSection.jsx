import React from 'react';
import { Section, ReportTable, NotTracked } from './ReportTable';
import { formatDate } from '@/lib/format-date';

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

  const formatBreakdown = (breakdown) =>
    (breakdown || []).map((b) => `${b.componentType} ${b.bloodGroup} x${b.count}`).join(', ') || '—';

  const bulkTransferRows = (bulkTransfer.rows || []).map((r) => [
    r.transferType === 'GIVE_LOAN' ? 'Given' : 'Taken',
    r.bloodBankName,
    formatDate(r.transferDate),
    r.bagCount,
    formatBreakdown(r.breakdown),
  ]);

  const givenBreakdownRows = (bulkTransfer.breakdown?.given || []).map((b) => [b.componentType, b.bloodGroup, b.count]);
  const takenBreakdownRows = (bulkTransfer.breakdown?.taken || []).map((b) => [b.componentType, b.bloodGroup, b.count]);

  return (
    <>
      <Section title="4. Repeated Donors">
        <ReportTable
          headers={['Male', 'Female', 'Total']}
          rows={[[repeatedDonors.male, repeatedDonors.female, repeatedDonors.total]]}
          alignRight={[0, 1, 2]}
        />
      </Section>

      <Section title="5. Donor Counselling Before Donation">
        {donorCounselling.available ? (
          <div className="text-sm font-medium text-slate-700">Total Donor Counselling = {donorCounselling.count}</div>
        ) : (
          <NotTracked note={donorCounselling.note} />
        )}
      </Section>

      <Section title="6. Bulk Transfer (Loan Given / Taken)">
        {bulkTransfer.available ? (
          <>
            <ReportTable
              headers={['Type', 'Blood Bank', 'Date', 'Bags', 'Component / Blood Group Breakdown']}
              rows={bulkTransferRows}
              alignRight={[3]}
            />
            <div className="text-sm font-medium text-slate-700">
              Given: {bulkTransfer.totals?.givenCount ?? 0} transfer(s), {bulkTransfer.totals?.givenBags ?? 0} bag(s)
              &nbsp;|&nbsp; Taken: {bulkTransfer.totals?.takenCount ?? 0} transfer(s), {bulkTransfer.totals?.takenBags ?? 0} bag(s)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Given — by Component &amp; Blood Group</div>
                <ReportTable headers={['Component', 'Blood Group', 'Bags']} rows={givenBreakdownRows} alignRight={[2]} />
              </div>
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Taken — by Component &amp; Blood Group</div>
                <ReportTable headers={['Component', 'Blood Group', 'Bags']} rows={takenBreakdownRows} alignRight={[2]} />
              </div>
            </div>
          </>
        ) : (
          <NotTracked note={bulkTransfer.note} />
        )}
      </Section>

      <Section title="7. Rejected / Deferred Donors (Reason-wise)">
        <ReportTable headers={['Reason', 'Count']} rows={rejectedRows} />
        <div className="text-sm font-medium text-slate-700">Total Deferred = {rejectedDonors.total}</div>
        <p className="text-[11px] text-slate-400">
          Sourced from Deferral records raised during donor screening — bucketed by keyword match on the deferral
          reason / source.
        </p>
      </Section>

      <Section title="8. Donor Testing Totals">
        <ReportTable
          headers={['Male', 'Female', 'Total']}
          rows={[[donorTesting.male, donorTesting.female, donorTesting.total]]}
          alignRight={[0, 1, 2]}
        />
      </Section>

      <Section title="9. Voluntary Donor Cards Issued">
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
