import { getQueue } from '@/core/queue';
import { childLogger } from '@/core/logger';
import { env } from '@/core/config/env';
import { invalidate } from '@/core/cache';
import { createUnitRepo } from '@/modules/unit/unit.repository';
import { auditService } from '@/modules/audit/audit.service';
import { notificationService } from '@/modules/notification/notification.service';
import { notificationCenterService } from '@/modules/notification/notification-center.service';
import { sendMail } from '@/core/mail';
import { renderEmail } from '@/shared/email/templates';
import {
  generateNearExpiryReportPdf,
  generateDiscardReportPdf,
  generateMonthlyMisReportPdf,
} from '@/core/pdf/pdf.service';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { countAcrossDonations } from '@/modules/donation/donation-collections.util';
import { DonorModel } from '@/modules/donor/donor.model';
import { CampModel } from '@/modules/camp/camp.model';
import { RequisitionModel } from '@/modules/requisition/requisition.model';

const log = childLogger({ module: 'inventory-jobs' });
const SYSTEM_ACTOR = env.SYSTEM_USER_ID;

const units = createUnitRepo();

// ─── Auto-Unreserve scan ────────────────────────────────────────────────────────

export async function runAutoUnreserveScan(): Promise<number> {
  const now = new Date();
  const reservedUnits = await BloodUnitModel.find({
    status: 'RESERVED',
    reservedUntil: { $lt: now },
    deletedAt: null,
  });

  const AUTO_UNRESERVE_REASON = 'Auto-cancelled reservation (expired after 3-day/7pm limit)';

  let unreservedCount = 0;
  for (const unit of reservedUnits) {
    try {
      const requisitionId = unit.reservedFor;
      await units.applyEvent({
        unitId: unit.unitId,
        event: 'UNRESERVE',
        actorId: SYSTEM_ACTOR,
        reason: AUTO_UNRESERVE_REASON,
        set: {
          reservedFor: null,
          reservedUntil: null,
          reservedAt: null,
          unreservedBy: 'SYSTEM',
          unreservedReason: AUTO_UNRESERVE_REASON,
        } as any,
      });

      // Keep the owning requisition's matched-unit entry in sync — same
      // fields the manual-unreserve paths set — so /requisition/list shows
      // "Unreserved — System unreserved" too, and any recorded crossmatch
      // (only ever valid for this specific reservation) is cleared back to
      // PENDING rather than silently carried into a future re-reservation.
      if (requisitionId) {
        await RequisitionModel.findOneAndUpdate(
          { _id: requisitionId, 'matchedUnits.unitId': unit.unitId },
          [
            {
              $set: {
                matchedUnits: {
                  $map: {
                    input: '$matchedUnits',
                    as: 'mu',
                    in: {
                      $cond: [
                        { $eq: ['$$mu.unitId', unit.unitId] },
                        {
                          $mergeObjects: [
                            '$$mu',
                            {
                              reserved: false,
                              unreservedBy: 'SYSTEM',
                              unreservedReason: AUTO_UNRESERVE_REASON,
                              crossmatchStatus: {
                                $cond: [
                                  { $eq: ['$$mu.crossmatchStatus', 'NOT_REQUIRED'] },
                                  'NOT_REQUIRED',
                                  'PENDING',
                                ],
                              },
                              compatibilityResult: null,
                              crossmatchDoneAt: null,
                              crossmatchSeenAt: null,
                              cardNumber: null,
                            },
                          ],
                        },
                        '$$mu',
                      ],
                    },
                  },
                },
              },
            },
          ],
        ).catch(() => undefined);
      }
      unreservedCount++;

      const dayBucket = new Date().toISOString().slice(0, 10);
      await notificationCenterService
        .notify({
          title: 'Reservation auto-expired',
          message: `Unit ${unit.unitId} (${unit.componentType} ${unit.aboGroup}${unit.rhFactor}) reservation auto-cancelled after 3-day limit`,
          module: 'INVENTORY',
          category: 'RESERVATION_EXPIRED',
          severity: 'INFORMATION',
          relatedRecordId: unit.unitId,
          relatedRecordType: 'BloodUnit',
          actionLink: '/inventory',
          dedupeKey: `RESERVATION_EXPIRED:${unit.unitId}:${dayBucket}`,
        })
        .catch(() => undefined);
    } catch (err) {
      log.warn({ unitId: unit.unitId, err: (err as Error).message }, 'auto-unreserve skipped');
    }
  }

  if (unreservedCount > 0) {
    await invalidate('inventory:*');
    await auditService.record({
      actorId: SYSTEM_ACTOR,
      action: 'STATE_TRANSITION',
      entityType: 'BloodUnit',
      entityId: `batch:unreserve:${unreservedCount}`,
      after: { event: 'UNRESERVE', count: unreservedCount },
      reason: 'auto-unreserve scan',
    });
  }

  return unreservedCount;
}

// ─── Reservation pre-expiry alerts (2h / 1h before auto-unreserve) ─────────────

export async function runReservationPreExpiryAlerts(): Promise<void> {
  const now = Date.now();
  const windows: Array<{ label: '2H' | '1H'; from: number; to: number }> = [
    { label: '2H', from: now + 60 * 60_000, to: now + 120 * 60_000 },
    { label: '1H', from: now, to: now + 60 * 60_000 },
  ];

  for (const w of windows) {
    const units = await BloodUnitModel.find({
      status: { $in: ['RESERVED', 'CROSSMATCHED'] },
      reservedUntil: { $gte: new Date(w.from), $lt: new Date(w.to) },
      deletedAt: null,
    });

    for (const unit of units) {
      await notificationCenterService
        .notify({
          title: `Reservation expiring in ~${w.label === '2H' ? '2 hours' : '1 hour'}`,
          message: `Unit ${unit.unitId} (${unit.componentType} ${unit.aboGroup}${unit.rhFactor}) reservation auto-cancels at ${unit.reservedUntil?.toLocaleString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })} unless issued`,
          module: 'INVENTORY',
          category: 'RESERVATION_EXPIRED',
          severity: 'WARNING',
          relatedRecordId: unit.unitId,
          relatedRecordType: 'BloodUnit',
          actionLink: '/inventory/reserve',
          dedupeKey: `RESERVATION_DUE_${w.label}:${unit.unitId}`,
        })
        .catch(() => undefined);
    }
  }
}

// ─── Daily "still reserved" reminder (09:00 IST) ───────────────────────────────

export async function runDailyReservedReminder(): Promise<number> {
  const units = await BloodUnitModel.find({
    status: { $in: ['RESERVED', 'CROSSMATCHED'] },
    deletedAt: null,
  }).lean();
  if (units.length === 0) return 0;

  const byRequisition = new Map<string, typeof units>();
  for (const u of units) {
    const key = u.reservedFor ? String(u.reservedFor) : 'unknown';
    const list = byRequisition.get(key) ?? [];
    list.push(u);
    byRequisition.set(key, list);
  }

  const dayBucket = new Date().toISOString().slice(0, 10);
  for (const [requisitionId, list] of byRequisition) {
    if (requisitionId === 'unknown') continue;
    const req = await RequisitionModel.findById(requisitionId).select('requisitionId patient').lean();
    const patientName = req?.patient?.name ?? 'Unknown patient';
    const components = list
      .map((u) => `${u.componentType} ${u.aboGroup}${u.rhFactor}`)
      .join(', ');
    await notificationCenterService
      .notify({
        title: 'Still reserved',
        message: `${patientName} — requisition ${req?.requisitionId ?? requisitionId} still holds: ${components}`,
        module: 'INVENTORY',
        category: 'RESERVATION_EXPIRED',
        severity: 'INFORMATION',
        relatedRecordId: requisitionId,
        relatedRecordType: 'Requisition',
        actionLink: `/requisition/${requisitionId}`,
        dedupeKey: `RESERVATION_DAILY_REMINDER:${requisitionId}:${dayBucket}`,
      })
      .catch(() => undefined);
  }

  return byRequisition.size;
}

// ─── Expiry scan ──────────────────────────────────────────────────────────────

export async function runExpiryScan(): Promise<{ expired: number; nearExpiry: number }> {
  // 1. Expire past-date units via state machine.
  const expiredIds = await units.findExpiredUnitIds();
  let expired = 0;
  for (const unitId of expiredIds) {
    try {
      await units.applyEvent({
        unitId,
        event: 'EXPIRE',
        actorId: SYSTEM_ACTOR,
        reason: 'Auto-expired (past expiry date)',
        set: { discardReason: 'EXPIRED' },
      });
      expired++;
    } catch (err) {
      log.warn({ unitId, err: (err as Error).message }, 'expire transition skipped');
    }
  }

  // 1.5 Auto-unreserve expired reservations.
  try {
    const unreserved = await runAutoUnreserveScan();
    if (unreserved > 0) {
      log.info({ unreserved }, 'auto-unreserve scan completed');
    }
  } catch (err) {
    log.warn({ err: (err as Error).message }, 'auto-unreserve scan failed');
  }
  if (expired > 0) {
    await invalidate('inventory:*');
    await auditService.record({
      actorId: SYSTEM_ACTOR,
      action: 'STATE_TRANSITION',
      entityType: 'BloodUnit',
      entityId: `batch:${expired}`,
      after: { event: 'EXPIRE', count: expired },
      reason: 'daily expiry scan',
    });
  }

  // 2. Near-expiry alert with PDF attachment.
  const near = await units.findNearExpiry(env.NEAR_EXPIRY_DAYS);
  if (near.length > 0 && env.ADMIN_EMAIL) {
    const reportDate = new Date().toISOString().slice(0, 10);
    const unitRows = near.map((u) => {
      const expDate = new Date(u.expiresAt);
      const daysLeft = Math.ceil((expDate.getTime() - Date.now()) / 86_400_000);
      return {
        unitId: u.unitId,
        componentType: u.componentType,
        aboGroup: u.aboGroup,
        rhFactor: u.rhFactor,
        expiresAt: u.expiresAt,
        daysLeft: Math.max(0, daysLeft),
      };
    });

    const details = unitRows
      .map(
        (u) =>
          `${u.unitId}  ${u.componentType}  ${u.aboGroup}${u.rhFactor}  expires ${u.expiresAt.slice(0, 10)}  (${u.daysLeft}d)`,
      )
      .join('\n');

    const rendered = renderEmail('NEAR_EXPIRY_ALERT', {
      count: near.length,
      reportDate,
      details,
      daysThreshold: env.NEAR_EXPIRY_DAYS,
    });

    let pdfBuffer: Buffer | undefined;
    try {
      pdfBuffer = await generateNearExpiryReportPdf({
        reportDate,
        daysThreshold: env.NEAR_EXPIRY_DAYS,
        units: unitRows,
      });
    } catch (err) {
      log.warn({ err: (err as Error).message }, 'near-expiry PDF generation failed');
    }

    await sendMail({
      to: env.ADMIN_EMAIL,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      attachments: pdfBuffer
        ? [{ filename: `near-expiry-${reportDate}.pdf`, content: pdfBuffer }]
        : undefined,
    });
  }

  log.info({ expired, nearExpiry: near.length }, 'expiry scan complete');
  return { expired, nearExpiry: near.length };
}

// ─── Discard report ───────────────────────────────────────────────────────────

export async function runDailyDiscardReport(): Promise<number> {
  if (!env.ADMIN_EMAIL) return 0;

  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const discarded = (await BloodUnitModel.find({
    status: { $in: ['DISCARDED', 'EXPIRED'] },
    updatedAt: { $gte: startOfDay, $lte: endOfDay },
  })
    .select('unitId componentType aboGroup rhFactor discardReason updatedAt updatedBy')
    .lean()) as Array<{
    unitId: string;
    componentType: string;
    aboGroup: string;
    rhFactor: string;
    discardReason: string;
    updatedAt: Date;
    updatedBy?: unknown;
  }>;

  if (discarded.length === 0) {
    log.info('no units discarded today — skipping discard report');
    return 0;
  }

  const byReason = Object.entries(
    discarded.reduce<Record<string, number>>((acc, u) => {
      const r = u.discardReason ?? 'UNKNOWN';
      acc[r] = (acc[r] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  const reportDate = today.toISOString().slice(0, 10);

  const rendered = renderEmail('DISCARD_REPORT', {
    reportDate,
    totalDiscarded: discarded.length,
    byReason,
    details: discarded
      .map(
        (u) =>
          `${u.unitId}  ${u.componentType}  ${u.aboGroup}${u.rhFactor}  ${u.discardReason ?? 'UNKNOWN'}`,
      )
      .join('\n'),
  });

  let pdfBuffer: Buffer | undefined;
  try {
    pdfBuffer = await generateDiscardReportPdf({
      reportDate,
      units: discarded.map((u) => ({
        unitId: u.unitId,
        componentType: u.componentType,
        aboGroup: u.aboGroup,
        rhFactor: u.rhFactor,
        discardReason: u.discardReason ?? 'UNKNOWN',
        discardedAt: u.updatedAt.toISOString(),
      })),
      byReason,
    });
  } catch (err) {
    log.warn({ err: (err as Error).message }, 'discard report PDF generation failed');
  }

  await sendMail({
    to: env.ADMIN_EMAIL,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    attachments: pdfBuffer
      ? [{ filename: `discard-report-${reportDate}.pdf`, content: pdfBuffer }]
      : undefined,
  });

  log.info({ reportDate, total: discarded.length }, 'daily discard report sent');
  return discarded.length;
}

// ─── Monthly MIS report ───────────────────────────────────────────────────────

export async function runMonthlyMisReport(): Promise<void> {
  if (!env.ADMIN_EMAIL) return;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed — we want previous month
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 0, 23, 59, 59, 999);
  const monthLabel = from.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  const [
    totalDonations,
    totalUnitsIssued,
    totalDiscarded,
    totalExpired,
    reactiveCount,
    campCount,
    newDonors,
  ] = await Promise.all([
    countAcrossDonations({ collectedAt: { $gte: from, $lte: to }, deletedAt: null }),
    BloodUnitModel.countDocuments({ status: 'ISSUED', updatedAt: { $gte: from, $lte: to } }),
    BloodUnitModel.countDocuments({ status: 'DISCARDED', updatedAt: { $gte: from, $lte: to } }),
    BloodUnitModel.countDocuments({ status: 'EXPIRED', updatedAt: { $gte: from, $lte: to } }),
    // Count donations with any reactive TTI (via TTI model)
    (async () => {
      try {
        const { TtiResultModel } = await import('@/modules/tti/tti.model');
        return TtiResultModel.countDocuments({
          releaseDecision: 'reactive',
          updatedAt: { $gte: from, $lte: to },
        });
      } catch {
        return 0;
      }
    })(),
    CampModel.countDocuments({ createdAt: { $gte: from, $lte: to } }),
    DonorModel.countDocuments({ createdAt: { $gte: from, $lte: to }, deletedAt: null }),
  ]);

  const componentBreakdown = await BloodUnitModel.aggregate([
    { $match: { createdAt: { $gte: from, $lte: to } } },
    {
      $group: {
        _id: '$componentType',
        collected: { $sum: 1 },
        issued: { $sum: { $cond: [{ $eq: ['$status', 'ISSUED'] }, 1, 0] } },
        discarded: { $sum: { $cond: [{ $eq: ['$status', 'DISCARDED'] }, 1, 0] } },
      },
    },
    { $project: { componentType: '$_id', collected: 1, issued: 1, discarded: 1, _id: 0 } },
    { $sort: { collected: -1 } },
  ]);

  const bloodGroupBreakdown = await BloodUnitModel.aggregate([
    { $match: { createdAt: { $gte: from, $lte: to } } },
    {
      $group: {
        _id: { aboGroup: '$aboGroup', rhFactor: '$rhFactor' },
        issued: { $sum: { $cond: [{ $eq: ['$status', 'ISSUED'] }, 1, 0] } },
        discarded: { $sum: { $cond: [{ $eq: ['$status', 'DISCARDED'] }, 1, 0] } },
      },
    },
    {
      $project: {
        bloodGroup: '$_id.aboGroup',
        rh: '$_id.rhFactor',
        issued: 1,
        discarded: 1,
        _id: 0,
      },
    },
    { $sort: { issued: -1 } },
  ]);

  const data = {
    month: monthLabel,
    totalDonations,
    totalUnitsIssued,
    totalDiscarded,
    totalExpired,
    reactiveCount,
    campCount,
    newDonors,
    componentBreakdown,
    bloodGroupBreakdown,
  };

  const rendered = renderEmail('MONTHLY_MIS_REPORT', data);

  let pdfBuffer: Buffer | undefined;
  try {
    pdfBuffer = await generateMonthlyMisReportPdf(data);
  } catch (err) {
    log.warn({ err: (err as Error).message }, 'monthly MIS PDF generation failed');
  }

  await sendMail({
    to: env.ADMIN_EMAIL,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    attachments: pdfBuffer
      ? [
          {
            filename: `mis-report-${monthLabel.replace(' ', '-').toLowerCase()}.pdf`,
            content: pdfBuffer,
          },
        ]
      : undefined,
  });

  log.info({ month: monthLabel, totalDonations, totalUnitsIssued }, 'monthly MIS report sent');
}

// ─── Job registration ─────────────────────────────────────────────────────────

export function registerInventoryJobs(): void {
  const expiryQueue = getQueue('inventory-maintenance');
  const discardQueue = getQueue('inventory-reports');
  const misQueue = getQueue('inventory-reports');
  const reservationQueue = getQueue('inventory-maintenance');
  const reservationReportQueue = getQueue('inventory-reports');

  reservationQueue.process('hourly-reservation-scan', async () => {
    await runReservationPreExpiryAlerts();
    await runAutoUnreserveScan();
  });
  void reservationQueue.add(
    'hourly-reservation-scan',
    {},
    {
      repeat: { cron: '0 * * * *', tz: 'Asia/Kolkata' }, // every hour, on the hour
      removeOnComplete: true,
      removeOnFail: 50,
      jobId: 'hourly-reservation-scan',
    },
  );

  reservationReportQueue.process('daily-reserved-reminder', async () => runDailyReservedReminder());
  void reservationReportQueue.add(
    'daily-reserved-reminder',
    {},
    {
      repeat: { cron: '0 9 * * *', tz: 'Asia/Kolkata' }, // daily 09:00 IST
      removeOnComplete: true,
      removeOnFail: 50,
      jobId: 'daily-reserved-reminder',
    },
  );

  expiryQueue.process('daily-expiry-scan', async () => runExpiryScan());
  void expiryQueue.add(
    'daily-expiry-scan',
    {},
    {
      repeat: { cron: '0 8 * * *', tz: 'Asia/Kolkata' }, // daily 08:00 IST
      removeOnComplete: true,
      removeOnFail: 50,
      jobId: 'daily-expiry-scan',
    },
  );

  discardQueue.process('daily-discard-report', async () => runDailyDiscardReport());
  void discardQueue.add(
    'daily-discard-report',
    {},
    {
      repeat: { cron: '30 21 * * *', tz: 'Asia/Kolkata' }, // daily 21:30 IST (end of day)
      removeOnComplete: true,
      removeOnFail: 50,
      jobId: 'daily-discard-report',
    },
  );

  misQueue.process('monthly-mis-report', async () => runMonthlyMisReport());
  void misQueue.add(
    'monthly-mis-report',
    {},
    {
      repeat: { cron: '0 6 1 * *', tz: 'Asia/Kolkata' }, // 1st of each month 06:00 IST
      removeOnComplete: true,
      removeOnFail: 50,
      jobId: 'monthly-mis-report',
    },
  );

  log.info('inventory expiry scan scheduled (daily 08:00)');
  log.info('daily discard report scheduled (daily 21:30)');
  log.info('monthly MIS report scheduled (1st of month 06:00)');
  log.info('hourly reservation scan scheduled (every hour)');
  log.info('daily still-reserved reminder scheduled (daily 09:00)');
}
