import React from 'react';
import { Section, ReportTable } from './ReportTable';
import { COMPONENT_TYPES } from '@/constants/component-types';

const GROUP_LABELS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const PRODUCTS = COMPONENT_TYPES.map((c) => c.value);

export default function CampWiseSection({ campWise }) {
  const rows = campWise?.rows || [];

  const overviewRows = rows.map((r) => [
    r.campName,
    r.donorCount,
    r.donationCount,
    r.deferralCount,
    r.gender.male,
    r.gender.female,
    r.gender.other,
    r.gender.total,
  ]);

  const groupRows = rows.map((r) => [
    r.campName,
    ...GROUP_LABELS.map((g) => r.groupCounts[g] ?? 0),
    GROUP_LABELS.reduce((sum, g) => sum + (r.groupCounts[g] ?? 0), 0),
  ]);

  const productRows = rows.map((r) => [
    r.campName,
    ...PRODUCTS.map((p) => r.productCounts[p] ?? 0),
    PRODUCTS.reduce((sum, p) => sum + (r.productCounts[p] ?? 0), 0),
  ]);

  return (
    <Section title="19. Camp-wise Donor & Donation Summary">
      <div>
        <div className="text-xs font-semibold text-slate-600 mb-1.5">Overview</div>
        <ReportTable
          headers={['Camp', 'Donors', 'Donations', 'Deferrals', 'Male', 'Female', 'Other', 'Total']}
          rows={overviewRows}
          alignRight={[1, 2, 3, 4, 5, 6, 7]}
        />
      </div>

      <div>
        <div className="text-xs font-semibold text-slate-600 mb-1.5">Blood Group-wise Collection</div>
        <ReportTable
          headers={['Camp', ...GROUP_LABELS, 'Total']}
          rows={groupRows}
          alignRight={GROUP_LABELS.map((_, i) => i + 1).concat([GROUP_LABELS.length + 1])}
        />
      </div>

      <div>
        <div className="text-xs font-semibold text-slate-600 mb-1.5">Component-wise Collection</div>
        <ReportTable
          headers={['Camp', ...PRODUCTS, 'Total']}
          rows={productRows}
          alignRight={PRODUCTS.map((_, i) => i + 1).concat([PRODUCTS.length + 1])}
        />
      </div>

      <p className="text-[11px] text-slate-400">
        Deferral counts are approximated by matching deferrals raised in the period to donors who donated at that
        camp during the period — Deferral records have no direct camp link in the data model.
      </p>
    </Section>
  );
}
