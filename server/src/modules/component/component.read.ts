import { DonationModel } from '@/modules/donation/donation.model';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { TtiResultModel } from '@/modules/tti/tti.model';
import { mapSerologyTests, hasLeftBank } from '@/modules/component/component.mapper';
import { componentSlot } from './component.helpers';
import type { ComponentListFilters } from './component.helpers';

export async function componentList(filters: ComponentListFilters) {
  const { page, limit, type, status, expiryBefore, fromDate, toDate, search, order, site, campId } =
    filters;

  const unitFilter: any = { deletedAt: null, status: { $ne: 'COLLECTED' } };
  if (type) unitFilter.componentType = type;
  if (status) {
    if (status === 'in-stock') unitFilter.status = 'RELEASED';
    else if (status === 'reserved') unitFilter.status = 'RESERVED';
    else if (status === 'issued') unitFilter.status = 'ISSUED';
    else if (status === 'discarded') unitFilter.status = 'DISCARDED';
  }
  if (expiryBefore) unitFilter.expiresAt = { $lte: new Date(expiryBefore) };
  if (search) {
    const searchRegex = new RegExp(search, 'i');
    unitFilter.$or = [
      { donationId: searchRegex },
      { unitId: searchRegex },
      { aboGroup: searchRegex },
    ];
  }

  const hasUnitFilters = Boolean(type || status || expiryBefore || search);
  const matchingDonationIds = hasUnitFilters
    ? await BloodUnitModel.distinct('donationId', unitFilter)
    : [];

  const donationFilter: any = { deletedAt: null };
  if (hasUnitFilters) donationFilter.donationId = { $in: matchingDonationIds };
  if (fromDate || toDate) {
    donationFilter.collectedAt = {};
    if (fromDate) donationFilter.collectedAt.$gte = new Date(fromDate);
    if (toDate) donationFilter.collectedAt.$lte = new Date(toDate);
  }
  if (search && !matchingDonationIds.length && !hasUnitFilters) {
    donationFilter.donationId = new RegExp(search, 'i');
  }
  if (campId) {
    donationFilter.campId = campId;
  } else if (site === 'inhouse') {
    donationFilter.campId = null;
  } else if (site === 'camp') {
    donationFilter.campId = { $ne: null };
  }

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 50;
  const skipNum = (pageNum - 1) * limitNum;
  const sortDir = order === 'asc' ? 1 : -1;

  const total = await DonationModel.countDocuments(donationFilter);
  const donations = await DonationModel.find(donationFilter)
    .sort({ collectedAt: sortDir })
    .skip(skipNum)
    .limit(limitNum)
    .populate('campId', 'name')
    .lean();

  const donationIds = donations.map((d) => d.donationId);
  const allUnits = await BloodUnitModel.find({
    donationId: { $in: donationIds },
    deletedAt: null,
    status: { $ne: 'COLLECTED' },
  }).lean();
  const ttiResults = await TtiResultModel.find({ donationId: { $in: donationIds } }).lean();

  const unitsMap: Record<string, typeof allUnits> = {};
  allUnits.forEach((u) => {
    if (!u.donationId) return;
    (unitsMap[u.donationId] ??= []).push(u);
  });
  const ttiMap = new Map(ttiResults.map((t) => [t.donationId, t]));

  const components = donations.map((d) => {
    const units = unitsMap[d.donationId] || [];
    const tti = ttiMap.get(d.donationId);

    const abo = tti?.aboGroupConfirmed || units[0]?.aboGroup || 'O';
    const rh = tti?.rhFactorConfirmed || units[0]?.rhFactor || 'POSITIVE';

    const separation = (d as any).separation;

    return {
      id: d._id.toString(),
      bagNo: (d as any).bagNo || d.donationId,
      segmentNo: (d as any).segmentNo || '',
      bloodGroup: `${abo}${rh === 'POSITIVE' ? '+' : '-'}`,
      site: d.campId ? (d.campId as any).name : 'Inhouse',
      createdAt: (d.createdAt ?? d.collectedAt).toISOString(),
      rpmFirstSpin: separation?.rpmFirstSpin || '',
      rpmSecondSpin: separation?.rpmSecondSpin || '',
      collectionTime: d.collectedAt.toISOString(),
      separationTime: separation?.separationTime ? separation.separationTime.toISOString() : '',
      serologyTests: mapSerologyTests(tti),
      canEdit: !hasLeftBank(units),
      editReason: (d as any).lastEditReason || undefined,
      lastEditedAt: (d as any).lastEditedAt
        ? new Date((d as any).lastEditedAt).toISOString()
        : undefined,
      prbc: componentSlot(units, ['PRBC', 'WB'], tti),
      ffp: componentSlot(units, ['FFP'], tti),
      rdp: componentSlot(units, ['RDP'], tti),
      cryo: componentSlot(units, ['CRYO'], tti),
      sdp: componentSlot(units, ['SDP'], tti),
    };
  });

  return { components, total, totalPages: Math.ceil(total / limitNum) };
}
