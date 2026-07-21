import { Types } from 'mongoose';
import { DonationModel } from '@/modules/donation/donation.model';
import { CampModel } from '@/modules/camp/camp.model';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { RequisitionModel } from '@/modules/requisition/requisition.model';
import { HospitalModel } from '@/modules/hospital/hospital.model';

export async function getDetailedDonationHistory(donorId: string): Promise<any[]> {
  const donations = await DonationModel.find({
    donor: new Types.ObjectId(donorId),
    deletedAt: null,
  })
    .sort({ collectedAt: -1 })
    .lean();

  const history = [];

  for (const donation of donations) {
    let donationPlace = 'Inhouse';
    if (donation.campId) {
      const camp = await CampModel.findById(donation.campId).lean();
      if (camp) {
        donationPlace = `Camp: ${camp.name}`;
      }
    }

    // Find components (BloodUnits) derived from this donation
    const components = await BloodUnitModel.find({
      donationId: donation.donationId,
      deletedAt: null,
    }).lean();

    const componentsWithReqs = [];
    for (const comp of components) {
      // Find if this component has a requisition
      let reqDoc = null;
      if (comp.reservedFor) {
        reqDoc = await RequisitionModel.findById(comp.reservedFor).lean();
      } else {
        reqDoc = await RequisitionModel.findOne({
          'matchedUnits.unitId': comp.unitId,
          deletedAt: null,
        }).lean();
      }

      let requisitionDetails = null;
      if (reqDoc) {
        const hospital = await HospitalModel.findById(reqDoc.hospitalId).lean();
        requisitionDetails = {
          requisitionId: reqDoc.requisitionId,
          hospitalName: hospital ? hospital.name : 'Unknown Hospital',
          patientName: reqDoc.patient?.name || 'N/A',
          urgency: reqDoc.requestedComponents?.find(rc => rc.componentType === comp.componentType)?.urgency || 'ROUTINE',
          status: reqDoc.status,
          requiredAt: reqDoc.requiredAt ? reqDoc.requiredAt.toISOString() : null,
        };
      }

      componentsWithReqs.push({
        unitId: comp.unitId,
        componentType: comp.componentType,
        aboGroup: comp.aboGroup,
        rhFactor: comp.rhFactor,
        volumeMl: comp.volumeMl,
        status: comp.status,
        expiresAt: comp.expiresAt ? comp.expiresAt.toISOString() : null,
        requisition: requisitionDetails,
      });
    }

    history.push({
      donationId: donation.donationId,
      bagNo: donation.bagNo,
      segmentNo: donation.segmentNo || 'N/A',
      lotNo: donation.lotNo || 'N/A',
      collectedAt: donation.collectedAt ? donation.collectedAt.toISOString() : null,
      donationPlace,
      components: componentsWithReqs,
    });
  }

  return history;
}
