export interface DonorDto {
  id: string;
  donorId?: string;
  name: { firstName: string; middleName?: string; lastName: string };
  uid?: string;
  dob: string;
  sex: 'M' | 'F' | 'O';
  phone: string;
  email?: string;
  donationHistory?: any[];
  address: {
    line1?: string;
    line2?: string;
    city: string;
    district: string;
    state: string;
    pincode?: string;
  };
  occupation?: string;
  weightKg: number;
  bloodGroup: 'A' | 'B' | 'AB' | 'O';
  rh: 'Positive' | 'Negative';
  eligibilityStatus?: 'eligible' | 'deferred' | 'temp-deferred';
  lastDonationDate?: string;
  lastDonationPlace?: 'SANJIVANI_BLOOD_BANK' | 'OTHER';
  lastDonationId?: string;
  recentDonationDate?: string;
  emergencyDonationWillingness?: string;
  isAvailableToDonate?: boolean;
  daysUntilEligible?: number;
  ttiReactive?: boolean;
  deferralReason?: string;
  deferralUntil?: string | null;
  source?: 'inhouse' | 'camp';
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RawDonor {
  _id: { toString(): string };
  donorId?: string;
  name: { firstName: string; middleName?: string; lastName: string };
  uid?: string;
  dob: Date;
  sex: 'M' | 'F' | 'O';
  phone: string;
  email?: string;
  address: DonorDto['address'];
  occupation?: string;
  weightKg: number;
  bloodGroup: DonorDto['bloodGroup'];
  rh: DonorDto['rh'];
  eligibilityStatus?: DonorDto['eligibilityStatus'];
  lastDonationDate?: Date;
  lastDonationPlace?: 'SANJIVANI_BLOOD_BANK' | 'OTHER';
  emergencyDonationWillingness?: string;
  createdAt: Date;
  updatedAt: Date;
}

export function toDto(raw: any): any {
  const firstName = raw.name?.firstName || '';
  const middleName = raw.name?.middleName || '';
  const lastName = raw.name?.lastName || '';
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');

  let age = 0;
  if (raw.dob) {
    const dobDate = new Date(raw.dob);
    const today = new Date();
    age = today.getFullYear() - dobDate.getFullYear();
    const m = today.getMonth() - dobDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
      age--;
    }
  }

  let isAvailableToDonate = true;
  let daysUntilEligible = 0;
  if (raw.lastDonationDate) {
    const lastDate = raw.lastDonationDate instanceof Date ? raw.lastDonationDate : new Date(raw.lastDonationDate);
    const now = new Date();
    lastDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffTime = now.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const waitingPeriod = raw.sex === 'F' ? 120 : 90;
    if (diffDays < waitingPeriod) {
      isAvailableToDonate = false;
      daysUntilEligible = waitingPeriod - diffDays;
    }
  }

  return {
    id: raw._id?.toString() || raw.id,
    _id: raw._id?.toString() || raw.id,
    donorId: raw.donorId,
    name: raw.name,
    fullName,
    age,
    city: raw.address?.city,
    uid: raw.uid,
    dob: raw.dob instanceof Date ? raw.dob.toISOString() : new Date(raw.dob).toISOString(),
    sex: raw.sex,
    phone: raw.phone,
    email: raw.email,
    address: raw.address,
    occupation: raw.occupation,
    weightKg: raw.weightKg,
    bloodGroup: raw.bloodGroup,
    rh: raw.rh === 'POSITIVE' ? 'Positive' : raw.rh === 'NEGATIVE' ? 'Negative' : raw.rh,
    eligibilityStatus: raw.eligibilityStatus,
    lastDonationDate: raw.lastDonationDate ? (raw.lastDonationDate instanceof Date ? raw.lastDonationDate.toISOString() : new Date(raw.lastDonationDate).toISOString()) : undefined,
    lastDonationPlace: raw.lastDonationPlace || undefined,
    emergencyDonationWillingness: raw.emergencyDonationWillingness || '',
    isAvailableToDonate,
    daysUntilEligible,
    deletedAt: raw.deletedAt ? (raw.deletedAt instanceof Date ? raw.deletedAt.toISOString() : new Date(raw.deletedAt).toISOString()) : null,
    createdAt: raw.createdAt ? (raw.createdAt instanceof Date ? raw.createdAt.toISOString() : new Date(raw.createdAt).toISOString()) : new Date().toISOString(),
    updatedAt: raw.updatedAt ? (raw.updatedAt instanceof Date ? raw.updatedAt.toISOString() : new Date(raw.updatedAt).toISOString()) : new Date().toISOString(),
  };
}
