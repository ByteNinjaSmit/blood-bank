import { Types } from 'mongoose';
import type { Donation } from '@/modules/donation/donation.model';
import { findAcrossDonations } from '@/modules/donation/donation-collections.util';
import { CampModel } from '@/modules/camp/camp.model';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { RequisitionModel } from '@/modules/requisition/requisition.model';
import { HospitalModel } from '@/modules/hospital/hospital.model';
import { TtiResultModel } from '@/modules/tti/tti.model';

export async function getDetailedDonationHistory(donorId: string): Promise<any[]> {
  const donations = (
    await findAcrossDonations<Donation & { _id: Types.ObjectId }>({
      donor: new Types.ObjectId(donorId),
      deletedAt: null,
    })
  ).sort((a, b) => (b.collectedAt?.getTime() ?? 0) - (a.collectedAt?.getTime() ?? 0));

  if (donations.length === 0) return [];

  const campIds = [...new Set(donations.map((d) => d.campId).filter(Boolean))] as Types.ObjectId[];
  const donationIds = donations.map((d) => d.donationId);

  const [camps, components, ttiResults] = await Promise.all([
    campIds.length
      ? CampModel.find({ _id: { $in: campIds } }, { name: 1 }).lean()
      : Promise.resolve([]),
    BloodUnitModel.find({ donationId: { $in: donationIds }, deletedAt: null }).lean(),
    TtiResultModel.find({ donationId: { $in: donationIds } })
      .select('donationId releaseDecision editReason lastEditedAt')
      .lean(),
  ]);

  const campById = new Map(camps.map((c) => [c._id.toString(), c]));
  const ttiByDonationId = new Map(ttiResults.map((t) => [t.donationId, t]));

  const componentUnitIds = components.map((c) => c.unitId);
  const reservedForIds = [
    ...new Set(
      components
        .map((c) => c.reservedFor)
        .filter(Boolean)
        .map((id) => id!.toString()),
    ),
  ].map((id) => new Types.ObjectId(id));

  const [reqsById, reqsByUnitId] = await Promise.all([
    reservedForIds.length
      ? RequisitionModel.find({ _id: { $in: reservedForIds } }).lean()
      : Promise.resolve([]),
    RequisitionModel.find({
      'matchedUnits.unitId': { $in: componentUnitIds },
      deletedAt: null,
    }).lean(),
  ]);

  const reqByIdMap = new Map(reqsById.map((r) => [r._id.toString(), r]));
  const reqByUnitIdMap = new Map<string, (typeof reqsByUnitId)[number]>();
  for (const req of reqsByUnitId) {
    for (const mu of req.matchedUnits ?? []) {
      if (!reqByUnitIdMap.has(mu.unitId)) reqByUnitIdMap.set(mu.unitId, req);
    }
  }

  const hospitalIds = [
    ...new Set(
      [...reqByIdMap.values(), ...reqByUnitIdMap.values()]
        .map((r) => r.hospitalId?.toString())
        .filter(Boolean),
    ),
  ].map((id) => new Types.ObjectId(id as string));
  const hospitals = hospitalIds.length
    ? await HospitalModel.find({ _id: { $in: hospitalIds } }, { name: 1 }).lean()
    : [];
  const hospitalById = new Map(hospitals.map((h) => [h._id.toString(), h]));

  const componentsByDonationId = new Map<string, typeof components>();
  for (const comp of components) {
    const list = componentsByDonationId.get(comp.donationId) ?? [];
    list.push(comp);
    componentsByDonationId.set(comp.donationId, list);
  }

  const buildRequisitionDetails = (comp: (typeof components)[number]) => {
    const reqDoc = comp.reservedFor
      ? reqByIdMap.get(comp.reservedFor.toString())
      : reqByUnitIdMap.get(comp.unitId);
    if (!reqDoc) return null;
    const hospital = hospitalById.get(reqDoc.hospitalId?.toString());
    return {
      requisitionId: reqDoc.requisitionId,
      hospitalName: hospital ? hospital.name : 'Unknown Hospital',
      patientName: reqDoc.patient?.name || 'N/A',
      urgency:
        reqDoc.requestedComponents?.find((rc) => rc.componentType === comp.componentType)
          ?.urgency || 'ROUTINE',
      status: reqDoc.status,
      requiredAt: reqDoc.requiredAt ? reqDoc.requiredAt.toISOString() : null,
    };
  };

  return donations.map((donation) => {
    const camp = donation.campId ? campById.get(donation.campId.toString()) : null;
    const donationPlace = camp ? `Camp: ${camp.name}` : 'Inhouse';

    const componentsWithReqs = (componentsByDonationId.get(donation.donationId) ?? []).map(
      (comp) => ({
        unitId: comp.unitId,
        componentType: comp.componentType,
        aboGroup: comp.aboGroup,
        rhFactor: comp.rhFactor,
        volumeMl: comp.volumeMl,
        status: comp.status,
        expiresAt: comp.expiresAt ? comp.expiresAt.toISOString() : null,
        requisition: buildRequisitionDetails(comp),
      }),
    );

    const tti = ttiByDonationId.get(donation.donationId);

    return {
      donationId: donation.donationId,
      bagNo: donation.bagNo,
      segmentNo: donation.segmentNo || 'N/A',
      lotNo: donation.lotNo || 'N/A',
      collectedAt: donation.collectedAt ? donation.collectedAt.toISOString() : null,
      donationPlace,
      components: componentsWithReqs,
      ttiReleaseDecision: tti?.releaseDecision,
      ttiEditReason: tti?.editReason || null,
      ttiLastEditedAt: tti?.lastEditedAt ? tti.lastEditedAt.toISOString() : null,
    };
  });
}
