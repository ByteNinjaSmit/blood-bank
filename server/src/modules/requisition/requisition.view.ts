// Read-model enrichment for requisitions shown to the client: joins
// BloodUnit/Donation/Donor/Hospital/Patient/User onto the raw
// RequisitionDto. Kept separate from `requisition.repository.ts` (which
// owns only the Requisition collection) and `requisition.service.ts`
// (business rules, no Mongoose) — same model-less cross-module shape
// as `mis`/`component`/`discard`.
import mongoose from 'mongoose';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { DonationModel } from '@/modules/donation/donation.model';
import { HospitalModel } from '@/modules/hospital/hospital.model';
import { PatientModel } from '@/modules/patient/patient.model';
import { DonorModel } from '@/modules/donor/donor.model';
import { UserModel } from '@/modules/user/user.model';

export async function enrichRequisition(reqDto: any): Promise<any> {
  if (!reqDto) return reqDto;
  const matchedUnits = reqDto.matchedUnits || [];
  const unitIds = matchedUnits.map((mu: any) => mu.unitId);
  const units = await BloodUnitModel.find({ unitId: { $in: unitIds }, deletedAt: null }).lean();
  const unitMap = new Map(units.map((u) => [u.unitId, u]));

  const donationIds = units.map((u) => u.donationId).filter(Boolean);
  const donations = (await DonationModel.find({ donationId: { $in: donationIds } })
    .select('donationId bagNo segmentNo collectedAt donor')
    .lean()) as any[];
  const donationMap = new Map(donations.map((d) => [d.donationId, d]));

  const donorIds = donations.map((d) => d.donor).filter(Boolean);
  const donors = (await DonorModel.find({ _id: { $in: donorIds } }).select('_id name').lean()) as any[];
  const donorMap = new Map(
    donors.map((d) => {
      const fullName = d.name
        ? [d.name.firstName, d.name.middleName, d.name.lastName].filter(Boolean).join(' ')
        : 'Unknown';
      return [d._id.toString(), fullName];
    }),
  );

  const matchedInventory = matchedUnits
    .map((mu: any) => {
      const unit = unitMap.get(mu.unitId);
      if (!unit) return null;
      const donation = donationMap.get(unit.donationId);
      return {
        inventoryId: {
          _id: unit.unitId,
          bagNo: {
            bagNo: donation?.bagNo || unit.donationId,
            bloodGroup: unit.aboGroup,
            rh: unit.rhFactor === 'POSITIVE' ? 'Positive' : 'Negative',
            donorName: donation?.donor ? donorMap.get(donation.donor.toString()) || 'Unknown' : 'Unknown',
            collectedAt: donation?.collectedAt
              ? donation.collectedAt.toISOString()
              : unit.collectedAt
                ? new Date(unit.collectedAt).toISOString()
                : null,
            segmentNo: donation?.segmentNo || unit.unitDin || unit.unitId || '—',
          },
          componentId: {
            componentType: unit.componentType,
            expiryDate: unit.expiresAt ? unit.expiresAt.toISOString() : '',
            volumeMl: unit.volumeMl,
          },
          status: unit.status,
          issuedAt: unit.issuedAt ? unit.issuedAt.toISOString() : null,
        },
        compatibilityType: mu.compatibilityType.toLowerCase(),
        crossmatchRequired: mu.crossmatchRequired,
        crossmatchStatus: mu.crossmatchStatus.toLowerCase(),
        reservedAt: mu.reservedAt,
        compatibilityResult: mu.compatibilityResult || null,
        crossmatchDoneAt: mu.crossmatchDoneAt ? new Date(mu.crossmatchDoneAt).toISOString() : null,
        crossmatchSeenAt: mu.crossmatchSeenAt ? new Date(mu.crossmatchSeenAt).toISOString() : null,
        cardNumber: mu.cardNumber || null,
      };
    })
    .filter(Boolean);

  let hospitalDoc = null;
  if (reqDto.hospitalId && mongoose.Types.ObjectId.isValid(reqDto.hospitalId)) {
    hospitalDoc = (await HospitalModel.findById(reqDto.hospitalId).select('name').lean()) as any;
  }

  let patientDoc = null;
  if (reqDto.patientId && mongoose.Types.ObjectId.isValid(reqDto.patientId)) {
    patientDoc = (await PatientModel.findById(reqDto.patientId).lean()) as any;
  }

  let age = '';
  if (patientDoc?.dob) {
    const birthDate = new Date(patientDoc.dob);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) calculatedAge--;
    age = String(calculatedAge);
  }

  const patientData = reqDto.patient
    ? { ...reqDto.patient, patientPublicId: reqDto.patient.patientPublicId || patientDoc?.patientPublicId }
    : patientDoc
      ? {
          name: patientDoc.name,
          address: patientDoc.address,
          age,
          sex: patientDoc.sex,
          mrn: patientDoc.medicalRecordNumber,
          patientPublicId: patientDoc.patientPublicId,
        }
      : undefined;

  const requestedComponents = (reqDto.requestedComponents || []).map((rc: any) => ({
    componentType: rc.componentType,
    units: rc.units,
    bloodGroup: rc.aboGroup,
    rh: rc.rhFactor === 'POSITIVE' ? 'Positive' : 'Negative',
    urgency: rc.urgency?.toLowerCase() === 'routine' ? 'regular' : rc.urgency?.toLowerCase(),
    compatibilityMode: rc.compatibilityMode || 'UNIVERSAL',
  }));

  let rejectedByDoc = null;
  if (reqDto.rejectedBy && mongoose.Types.ObjectId.isValid(reqDto.rejectedBy)) {
    rejectedByDoc = (await UserModel.findById(reqDto.rejectedBy).select('name username').lean()) as any;
  }

  return {
    ...reqDto,
    _id: reqDto.id || reqDto._id || '',
    requestId: reqDto.requisitionId,
    doctorName: reqDto.doctorName || reqDto.clinicianName,
    requestedComponents,
    matchedInventory,
    status: reqDto.status?.toLowerCase(),
    hospitalId: hospitalDoc ? { _id: reqDto.hospitalId, name: hospitalDoc.name } : reqDto.hospitalId,
    patient: patientData,
    rejectedBy: rejectedByDoc
      ? {
          _id: reqDto.rejectedBy,
          name: rejectedByDoc.name
            ? [rejectedByDoc.name.first, rejectedByDoc.name.last].filter(Boolean).join(' ')
            : rejectedByDoc.username || '',
        }
      : reqDto.rejectedBy,
  };
}
