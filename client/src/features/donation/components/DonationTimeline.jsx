import React from 'react';
import { CheckCircle2, XCircle, Clock, Droplets, TestTube, Scissors, Package, Building2, User } from 'lucide-react';

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
  TRANSFUSED:  'bg-pink-50 text-pink-700 border-pink-200',
  DISCARDED:   'bg-red-50 text-red-700 border-red-200',
  EXPIRED:     'bg-gray-50 text-gray-500 border-gray-200',
  RETURNED_UNUSED: 'bg-gray-50 text-gray-600 border-gray-200',
};

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

function TimelineStep({ icon, label, timestamp, status, detail, isLast }) {
  const StepIcon = icon;
  const done   = status === 'done';
  const failed = status === 'failed';

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
          done   ? 'bg-green-100 text-green-700 ring-2 ring-green-200' :
          failed ? 'bg-red-100 text-red-700 ring-2 ring-red-200' :
                   'bg-gray-100 text-gray-400'
        }`}>
          {done   ? <CheckCircle2 className="w-3.5 h-3.5" /> :
           failed ? <XCircle className="w-3.5 h-3.5" /> :
                    <Clock className="w-3.5 h-3.5" />}
        </div>
        {!isLast && <div className="w-px bg-gray-200 flex-1 my-1 min-h-[20px]" />}
      </div>

      <div className={`${isLast ? '' : 'pb-5'} flex-1`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <StepIcon className={`w-3.5 h-3.5 flex-shrink-0 ${
              done ? 'text-green-600' : failed ? 'text-red-600' : 'text-gray-400'
            }`} />
            <p className={`text-sm font-semibold leading-tight ${
              done ? 'text-gray-900' : failed ? 'text-red-700' : 'text-gray-400'
            }`}>{label}</p>
          </div>
          {timestamp && (
            <span className="text-xs text-gray-400 flex-shrink-0">{timestamp}</span>
          )}
        </div>
        {detail && (
          <p className={`text-xs mt-1 ml-5 leading-snug ${
            failed ? 'text-red-500' : 'text-gray-500'
          }`}>{detail}</p>
        )}
      </div>
    </div>
  );
}

export default function DonationTimeline({ donation }) {
  const isCamp = Boolean(donation.campId);
  const maxIdx = maxStatusIndex(donation.units);

  function unitReached(status) {
    return maxIdx >= UNIT_STATUS_ORDER.indexOf(status) ? 'done' : 'pending';
  }

  const ttiDecision = donation.ttiReleaseDecision;
  const ttiStatus =
    ttiDecision === 'released' ? 'done' :
    ttiDecision === 'rejected' ? 'failed' : 'pending';

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
      icon: Scissors,
      label: 'Component Separation',
      timestamp: null,
      status: maxIdx >= UNIT_STATUS_ORDER.indexOf('IN_TESTING') ? 'done' : 'pending',
      detail: donation.units && donation.units.length > 0
        ? `${donation.units.length} component${donation.units.length !== 1 ? 's' : ''}: ${[...new Set(donation.units.map(u => u.componentType))].join(', ')}`
        : 'No components yet',
    },
    {
      icon: TestTube,
      label: 'TTI Testing',
      timestamp: null,
      status: ttiStatus,
      detail: ttiDecision === 'released' ? 'All TTI tests cleared — units released from quarantine'
        : ttiDecision === 'rejected' ? 'TTI tests failed — units quarantined / discarded'
        : 'Awaiting serology results',
    },
    {
      icon: Package,
      label: 'Released to Inventory',
      timestamp: null,
      status: unitReached('RELEASED'),
      detail: maxIdx >= UNIT_STATUS_ORDER.indexOf('ISSUED')
        ? 'Units issued to patient / hospital'
        : maxIdx >= UNIT_STATUS_ORDER.indexOf('RELEASED')
        ? 'Units available in inventory'
        : 'Pending TTI clearance',
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
          <p className="text-xs text-gray-500">Donor: {donation.donorName}</p>
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
                  <p className="text-xs font-semibold text-gray-800">{u.componentType}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{u.unitId}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${
                    UNIT_STATUS_CLASSES[u.status] ?? 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}>
                    {u.status === 'RELEASED' ? 'INSTOCK' : u.status}
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
