import { Types } from 'mongoose';
import { DonationModel } from '@/modules/donation/donation.model';
import { toLegacyUnitStatus } from '@/modules/component/component.mapper';

export interface ComponentListFilters {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  expiryBefore?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  order?: 'asc' | 'desc';
  site?: 'inhouse' | 'camp';
  campId?: string;
}

export interface NearExpiryFilters {
  page?: number;
  limit?: number;
  days?: number;
  componentType?: string;
  status?: string;
  search?: string;
}

export async function resolveDonation(donationIdOrObjectId: string) {
  let donation = await DonationModel.findOne({
    donationId: donationIdOrObjectId,
    deletedAt: null,
  }).lean();
  if (!donation && Types.ObjectId.isValid(donationIdOrObjectId)) {
    donation = await DonationModel.findOne({
      _id: donationIdOrObjectId,
      deletedAt: null,
    }).lean();
  }
  return donation;
}

export function componentSlot(units: any[], types: string[], tti: any) {
  const u = units.find((x) => types.includes(x.componentType));
  if (!u) return { status: 'unprepared' as const };

  return {
    status: 'prepared' as const,
    componentStatus: toLegacyUnitStatus(u.status, tti?.releaseDecision),
    volumeMl: u.volumeMl,
    expiryDate: u.expiresAt ? u.expiresAt.toISOString() : '',
    storageLocation: u.storageLocation || 'Main Fridge',
  };
}
