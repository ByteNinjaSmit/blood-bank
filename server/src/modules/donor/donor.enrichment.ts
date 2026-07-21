import { Types } from 'mongoose';
import { DonationModel } from '@/modules/donation/donation.model';
import { DeferralModel } from '@/modules/deferral/deferral.model';
import { DonorModel } from './donor.model';
import type { DonorDto } from './donor.dto';

// Enriches a set of donor DTOs with their *actual* last donation (aggregated
// from the donations collection, not the possibly-stale Donor.lastDonationDate
// field), active-deferral status, and the resulting isAvailableToDonate /
// daysUntilEligible / eligibilityStatus. Used by both the register list and
// the donor search so they agree on who can donate right now.
export async function populateLastDonationId(dtos: DonorDto[]): Promise<DonorDto[]> {
  if (dtos.length === 0) return dtos;
  const donorIds = dtos.map(d => new Types.ObjectId(d.id));
  const donations = await DonationModel.aggregate([
    {
      $match: {
        donor: { $in: donorIds },
        $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
      },
    },
    { $sort: { collectedAt: -1, createdAt: -1 } },
    // Join each donation's TTI result to flag donors with any reactive result.
    {
      $lookup: {
        from: 'ttiresults',
        localField: 'donationId',
        foreignField: 'donationId',
        as: 'tti',
      },
    },
    {
      $group: {
        _id: '$donor',
        lastDonationId: { $first: '$_id' },
        lastDonationDate: { $first: '$collectedAt' },
        ttiReactive: {
          $max: {
            $cond: [
              {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: '$tti',
                        as: 't',
                        cond: { $eq: ['$$t.releaseDecision', 'reactive'] },
                      },
                    },
                  },
                  0,
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);
  const donationMap = new Map(
    donations.map(d => [
      d._id.toString(),
      { id: d.lastDonationId.toString(), date: d.lastDonationDate, ttiReactive: Boolean(d.ttiReactive) },
    ]),
  );

  // Derive each donor's eligibility from their currently-active deferrals so
  // the register always reflects reality — even for donors deferred (e.g. TTI
  // reactive) before the stored eligibilityStatus field was kept in sync.
  const nowTs = new Date();
  const activeDeferrals = (await DeferralModel.find({
    donor: { $in: donorIds },
    liftedAt: null,
    $or: [{ type: 'PERMANENT' }, { type: 'TEMPORARY', untilDate: { $gt: nowTs } }],
  })
    .select('donor type')
    .lean()) as Array<{ donor: { toString(): string }; type: string }>;
  const deferralStatusMap = new Map<string, 'deferred' | 'temp-deferred'>();
  activeDeferrals.forEach((d) => {
    const key = d.donor.toString();
    if (d.type === 'PERMANENT') deferralStatusMap.set(key, 'deferred');
    else if (deferralStatusMap.get(key) !== 'deferred') deferralStatusMap.set(key, 'temp-deferred');
  });

  return dtos.map(dto => {
    const dbDonation = donationMap.get(dto.id);
    let effectiveDate = dto.lastDonationDate;
    if (dbDonation?.date) {
      const dbDate = new Date(dbDonation.date);
      const profileDate = dto.lastDonationDate ? new Date(dto.lastDonationDate) : null;
      if (profileDate) {
        effectiveDate = dbDate > profileDate ? dbDate.toISOString() : profileDate.toISOString();
      } else {
        effectiveDate = dbDate.toISOString();
      }
    }

    let isAvailableToDonate = true;
    let daysUntilEligible = 0;
    if (effectiveDate) {
      const lastDate = new Date(effectiveDate);
      const now = new Date();
      lastDate.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      const diffTime = now.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const waitingPeriod = dto.sex === 'F' ? 120 : 90;
      if (diffDays < waitingPeriod) {
        isAvailableToDonate = false;
        daysUntilEligible = waitingPeriod - diffDays;
      }
    }

    const deferStatus = deferralStatusMap.get(dto.id);
    const ttiReactive = Boolean(dbDonation?.ttiReactive);
    // A TTI-reactive donor is permanently deferred; otherwise fall back to any
    // active deferral, then the stored status. Never show eligible when the
    // donor is reactive or under an active deferral.
    const effectiveEligibility = ttiReactive ? 'deferred' : (deferStatus || dto.eligibilityStatus);

    return {
      ...dto,
      lastDonationId: dbDonation?.id,
      // lastDonationDate stays exactly what's stored on the Donor record
      // (the historical value entered at registration) — it must never be
      // overwritten by an in-system donation's collection date. That
      // separate, actual donation date is surfaced as recentDonationDate
      // instead; effectiveDate (the max of the two) is used only for the
      // eligibility computation below, never returned as a date field.
      recentDonationDate: dbDonation?.date ? new Date(dbDonation.date).toISOString() : undefined,
      isAvailableToDonate: (ttiReactive || deferStatus) ? false : isAvailableToDonate,
      daysUntilEligible,
      ttiReactive,
      eligibilityStatus: effectiveEligibility,
    };
  });
}

// Set of donor _id strings currently inside their post-donation waiting window
// (90 days male / 120 days female), using the later of the stored profile
// lastDonationDate and their most recent actual donation. Mirrors the
// per-row interval logic in populateLastDonationId so the "recently-donated"
// filter and the displayed status agree.
export async function donorIdsWithinDonationWindow(now = new Date()): Promise<Set<string>> {
  const lastDonations = await DonationModel.aggregate([
    { $match: { $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] } },
    { $sort: { collectedAt: -1 } },
    { $group: { _id: '$donor', lastDate: { $first: '$collectedAt' } } },
  ]);
  const actualMap = new Map<string, Date>();
  for (const d of lastDonations) {
    if (d._id && d.lastDate) actualMap.set(d._id.toString(), new Date(d.lastDate));
  }

  const donors = (await DonorModel.find(
    {
      $or: [
        { lastDonationDate: { $ne: null } },
        { _id: { $in: lastDonations.map((d) => d._id).filter(Boolean) } },
      ],
    },
    { sex: 1, lastDonationDate: 1 },
  ).lean()) as Array<{ _id: { toString(): string }; sex?: string; lastDonationDate?: Date | null }>;

  const within = new Set<string>();
  for (const dn of donors) {
    const id = dn._id.toString();
    const profileDate = dn.lastDonationDate ? new Date(dn.lastDonationDate) : null;
    const actualDate = actualMap.get(id) ?? null;
    let eff: Date | null;
    if (profileDate && actualDate) eff = profileDate > actualDate ? profileDate : actualDate;
    else eff = profileDate ?? actualDate;
    if (!eff) continue;
    const diffDays = Math.floor((now.getTime() - eff.getTime()) / 86_400_000);
    const waiting = dn.sex === 'F' ? 120 : 90;
    if (diffDays < waiting) within.add(id);
  }
  return within;
}
