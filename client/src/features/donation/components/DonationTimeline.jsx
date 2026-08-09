import React from 'react';
import { CheckCircle2, XCircle, Clock, Droplets, TestTube, Scissors, Package, Building2, User, ClipboardCheck } from 'lucide-react';

const formatBloodGroup = (bloodGroup, rhFactor) => {
  if (!bloodGroup) return '';
  const baseGroup = bloodGroup.replace(/[\s+−-]+$/, '');
  const rh = String(rhFactor || '').toUpperCase();
  const sign = rh === 'POSITIVE' ? ' +' : rh === 'NEGATIVE' ? ' −' : '';
  return `${baseGroup}${sign}`;
};

const UNIT_STATUS_ORDER = [
  'COLLECTED', 'IN_TESTING', 'QUARANTINE', 'RELEASED',
  'RESERVED', 'CROSSMATCHED', 'ISSUED', 'TRANSFUSED',
];

const UNIT_STATUS_CLASSES = {
  COLLECTED:   'bg-blue-50 text-blue-700 border-blue-200',
  IN_TESTING:  'bg-yellow-50 text-yellow-700 border-yellow-200',
  QUARANTINE:  'bg-orange-50 text-orange-700 border-orange-200',
  RELEASED:    'bg-green-50 text-green-700 border-green-200',
  RESERVED:    'bg-teal-50 text-teal-700 border-teal-200',
  CROSSMATCHED:'bg-indigo-50 text-indigo-700 border-indigo-200',
  ISSUED:      'bg-purple-50 text-purple-700 border-purple-200',
  TRANSFUSED:  'bg-purple-50 text-purple-700 border-purple-200',
  DISCARDED:   'bg-red-50 text-red-700 border-red-200',
  EXPIRED:     'bg-gray-50 text-gray-500 border-gray-200',
  RETURNED_UNUSED: 'bg-gray-50 text-gray-600 border-gray-200',
};

// Bank-facing status vocabulary — TRANSFUSED is a clinical outcome that
// happens after the unit already left the bank as ISSUED, so from the
// bank's own inventory perspective it's still just "issued".
const UNIT_STATUS_DISPLAY = {
  RELEASED:   'INSTOCK',
  QUARANTINE: 'QUARANTINED',
  TRANSFUSED: 'ISSUED',
};

// SDP is collected by apheresis as a single already-separated product; the
// 'WB' componentType on its unit is only an internal placeholder (same
// derivation path whole-blood uses) and should never be shown to staff.
function displayComponentType(donationType, componentType) {
  return donationType === 'SDP' && componentType === 'WB' ? 'SDP' : componentType;
}

function maxStatusIndex(units) {
  if (!units || units.length === 0) return 0;
  return units.reduce((max, u) => {
    const idx = UNIT_STATUS_ORDER.indexOf(u.status);
    return idx > max ? idx : max;
  }, 0);
}

function fmt(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function TimelineStep({ icon, label, timestamp, status, detail, isLast, badge }) {
  const StepIcon = icon;
  const done       = status === 'done';
  const failed     = status === 'failed';
  const inProgress = status === 'in_progress';

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
          done       ? 'bg-green-100 text-green-700 ring-2 ring-green-200' :
          failed     ? 'bg-red-100 text-red-700 ring-2 ring-red-200' :
          inProgress ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-200' :
                       'bg-gray-100 text-gray-400'
        }`}>
          {done       ? <CheckCircle2 className="w-3.5 h-3.5" /> :
           failed     ? <XCircle className="w-3.5 h-3.5" /> :
           inProgress ? <Clock className="w-3.5 h-3.5 animate-pulse" /> :
                        <Clock className="w-3.5 h-3.5" />}
        </div>
        {!isLast && <div className="w-px bg-gray-200 flex-1 my-1 min-h-[20px]" />}
      </div>

      <div className={`${isLast ? '' : 'pb-5'} flex-1`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <StepIcon className={`w-3.5 h-3.5 flex-shrink-0 ${
              done ? 'text-green-600' : failed ? 'text-red-600' : inProgress ? 'text-amber-600' : 'text-gray-400'
            }`} />
            <p className={`text-sm font-semibold leading-tight ${
              done ? 'text-gray-900' : failed ? 'text-red-700' : inProgress ? 'text-amber-700' : 'text-gray-400'
            }`}>{label}</p>
            {inProgress && badge && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                {badge}
              </span>
            )}
          </div>
          {timestamp && (
            <span className="text-xs text-gray-400 flex-shrink-0">{timestamp}</span>
          )}
        </div>
        {detail && (
          <p className={`text-xs mt-1 ml-5 leading-snug ${
            failed ? 'text-red-500' : inProgress ? 'text-amber-600' : 'text-gray-500'
          }`}>{detail}</p>
        )}
      </div>
    </div>
  );
}

export default function DonationTimeline({ donation }) {
  const isCamp = Boolean(donation.campId);
  const maxIdx = maxStatusIndex(donation.units);

  const ttiDecision = donation.ttiReleaseDecision;
  const ttiStatus =
    ttiDecision === 'released' ? 'done' :
    ttiDecision === 'reactive' ? 'failed' :
    ttiDecision === 'indeterminate' ? 'in_progress' : 'pending';

  // Present whenever this donation's TTI panel has ever been corrected via
  // the Serology edit/retest action (tti.setEditMeta) — most commonly a
  // shadeness (indeterminate) retest, but also any other correction.
  const ttiRetestNote = donation.ttiEditReason
    ? `Retested in Serology${donation.ttiLastEditedAt ? ` on ${fmt(donation.ttiLastEditedAt)}` : ''}: ${donation.ttiEditReason}`
    : null;

  // Separation has actually started once any unit other than the raw
  // collection placeholder ('WB') exists — units.length alone isn't
  // reliable since a not-yet-separated donation still has exactly 1 unit.
  // It isn't *finished* until every derived unit has left 'COLLECTED' —
  // that only happens once staff sign off via "Mark as Complete" on the
  // Component Separate screen (separationCompleted() in
  // component.repository.ts), which fires SEPARATION_COMPLETE (or the
  // full TTI-release chain) on each unit. Until then the bag still shows
  // as "Under Separation" even though some components already have
  // volumes entered.
  //
  // A bag can also be "Under Separation" before any unit exists at all —
  // while it's staged (components/RPM entered but not yet finalized) in an
  // active batch on the Component Separate screen. That has no BloodUnit
  // to key off, so it's flagged separately via
  // donation.separationBatchActive (set/cleared by
  // POST /component/batch-draft[/clear] as bags join/leave a batch).
  const hasSeparated = donation.units && donation.units.some(u => u.componentType !== 'WB');
  const batchDraftActive = Boolean(donation.separationBatchActive);
  const separationInProgress =
    batchDraftActive || (hasSeparated && donation.units.some(u => u.status === 'COLLECTED'));
  const separationStepStatus = separationInProgress ? 'in_progress' : hasSeparated ? 'done' : 'pending';

  let releaseStatus;
  let releaseDetail;
  if (ttiDecision === 'reactive') {
    releaseStatus = 'failed';
    releaseDetail = 'TTI testing failed — components discarded';
  } else if (maxIdx >= UNIT_STATUS_ORDER.indexOf('ISSUED')) {
    releaseStatus = 'done';
    releaseDetail = 'Units issued to patient / hospital';
  } else if (maxIdx >= UNIT_STATUS_ORDER.indexOf('RELEASED')) {
    releaseStatus = 'done';
    releaseDetail = 'Units available in inventory';
  } else {
    releaseStatus = 'pending';
    releaseDetail = 'Pending TTI clearance';
  }

  const steps = [
    {
      icon: Droplets,
      label: 'Blood Collected',
      timestamp: fmt(donation.collectedAt),
      status: 'done',
      detail: `${donation.donationType ?? ''} — ${isCamp ? 'Camp donation' : 'Inhouse'}`,
    },
    {
      icon: User,
      label: 'Medical Exam',
      timestamp: fmt(donation.collectedAt),
      status: donation.medicalExam ? 'done' : 'pending',
      detail: donation.medicalExam
        ? [
            donation.medicalExam.hbGdl != null && `Hb: ${donation.medicalExam.hbGdl} g/dL`,
            donation.medicalExam.weightKg != null && `Weight: ${donation.medicalExam.weightKg} kg`,
            donation.medicalExam.pulseBpm != null && `Pulse: ${donation.medicalExam.pulseBpm} bpm`,
          ].filter(Boolean).join(' · ') || 'Exam recorded'
        : 'Pending',
    },
    {
      icon: CheckCircle2,
      label: 'Donor Fitness',
      timestamp: donation.donorFitness ? fmt(donation.collectedAt) : null,
      status: donation.donorFitness == null ? 'pending'
        : donation.donorFitness.isFit ? 'done'
        : 'failed',
      detail: donation.donorFitness
        ? donation.donorFitness.isFit
          ? 'Donor declared fit for donation'
          : `Rejected at ${donation.donorFitness.rejectedAtStep ?? '—'}: ${donation.donorFitness.rejectionReason ?? 'No reason recorded'}`
        : 'Pending fitness assessment',
    },
    {
      icon: ClipboardCheck,
      label: 'Donation Created',
      timestamp: fmt(donation.createdAt) ?? fmt(donation.collectedAt),
      status: 'done',
      detail: 'Blood bag has been collected and recorded in the system',
    },
    {
      icon: Scissors,
      label: 'Component Separation',
      timestamp: null,
      status: separationStepStatus,
      detail: hasSeparated
        ? `${separationInProgress ? 'Under Separation — ' : ''}${donation.units.length} component${donation.units.length !== 1 ? 's' : ''} entered: ${[...new Set(donation.units.map(u => displayComponentType(donation.donationType, u.componentType)))].join(', ')}`
        : batchDraftActive
          ? 'Under Separation — staged in a batch, not yet saved'
          : 'Not separated yet',
      badge: 'Under Separation',
    },
    {
      icon: TestTube,
      label: 'TTI Testing',
      timestamp: null,
      status: ttiStatus,
      detail: [
        ttiDecision === 'released' ? 'All TTI tests cleared — units released from quarantine'
          : ttiDecision === 'reactive' ? `Donor tested positive — ${donation.ttiReason || 'reactive result, units discarded'}`
          : ttiDecision === 'indeterminate' ? `Shadeness (indeterminate) result — quarantined pending retest${donation.ttiReason ? `: ${donation.ttiReason}` : ''}`
          : 'Awaiting serology results',
        ttiRetestNote,
      ].filter(Boolean).join(' · '),
      badge: 'Retest Needed',
    },
    {
      icon: Package,
      label: 'Released to Inventory',
      timestamp: null,
      status: releaseStatus,
      detail: releaseDetail,
    },
  ];

  return (
    <div>
      {/* Summary badge */}
      <div className="mb-5 p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border font-medium ${
            isCamp
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-orange-50 text-orange-700 border-orange-200'
          }`}>
            {isCamp ? <Building2 className="w-3 h-3" /> : <Droplets className="w-3 h-3" />}
            {isCamp ? 'Camp Donation' : 'Inhouse Donation'}
          </span>
          {donation.bloodGroup && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-700 border border-red-200 font-medium">
              {formatBloodGroup(donation.bloodGroup, donation.rhFactor)}
            </span>
          )}
        </div>
        <p className="text-xs font-mono text-gray-600 font-medium">{donation.donationId}</p>
        {donation.donorName && (
          <p className="text-xs text-gray-500">
            Donor: {donation.donorName}
            {donation.donorPublicId && <span className="font-mono text-gray-400"> ({donation.donorPublicId})</span>}
          </p>
        )}
        <p className="text-xs text-gray-400">
          {donation.unitCount} unit{donation.unitCount !== 1 ? 's' : ''} derived
        </p>
      </div>

      {/* Steps */}
      <div>
        {steps.map((step, i) => (
          <TimelineStep key={step.label} {...step} isLast={i === steps.length - 1} />
        ))}
      </div>

      {/* Unit status grid */}
      {donation.units && donation.units.filter(u => u.componentType === 'WHOLE_BLOOD' || u.status !== 'COLLECTED').length > 0 && (
        <div className="mt-5 pt-5 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Blood Units</p>
          <div className="space-y-2">
            {donation.units
              .filter(u => u.componentType === 'WHOLE_BLOOD' || u.status !== 'COLLECTED')
              .map((u, i) => (
              <div key={u.unitId ?? i} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 bg-white">
                <div>
                  <p className="text-xs font-semibold text-gray-800">{displayComponentType(donation.donationType, u.componentType)}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{u.unitId}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${
                    UNIT_STATUS_CLASSES[u.status] ?? 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}>
                    {UNIT_STATUS_DISPLAY[u.status] ?? u.status}
                  </span>
                  {u.volumeMl && (
                    <p className="text-xs text-gray-400 mt-0.5">{u.volumeMl} mL</p>
                  )}
                  {u.expiresAt && (
                    <p className="text-xs text-gray-400">
                      Exp {new Date(u.expiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
