import { Types } from 'mongoose';
import { findOneAcrossDonations } from '@/modules/donation/donation-collections.util';
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
  let donation = await findOneAcrossDonations({
    donationId: donationIdOrObjectId,
    deletedAt: null,
  });
  if (!donation && Types.ObjectId.isValid(donationIdOrObjectId)) {
    donation = await findOneAcrossDonations({
      _id: donationIdOrObjectId,
      deletedAt: null,
    });
  }
  return donation;
}

// Component separation from a whole-blood donation only ever yields these
// four derived products — WB is never re-selected. Mirrors
// client/src/features/component/pages/ComponentSeparate.jsx's
// SEPARABLE_COMPONENT_TYPES exactly; keep the two in sync.
export const SEPARABLE_COMPONENT_TYPES = ['PRBC', 'FFP', 'RDP', 'CRYO'];

/**
 * Bag-type capacity: Single/Double bags only ever split into PRBC + FFP;
 * Triple/Quad bags can additionally yield RDP and CRYO. SDP donations are
 * apheresis-collected as a single, already-separated product.
 */
export function allowedComponentTypes(typeOfBag: string | undefined, donationType: string | undefined) {
  if (donationType === 'SDP') return ['SDP'];
  if (typeOfBag === 'TB' || typeOfBag === 'QB') return SEPARABLE_COMPONENT_TYPES;
  return ['PRBC', 'FFP'];
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
