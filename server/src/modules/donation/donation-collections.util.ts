// Helpers for querying across the two physical donation collections:
// DonationModel (in-house, collection `donations`) and
// CampDonationRecordModel (camp, collection `campdonationrecords`).
//
// Any module that needs a donation lookup without already knowing which
// collection it lives in (e.g. reverse lookups by donationId/bagNo/donor,
// or "does this donor have any donation history") should go through these
// instead of importing DonationModel directly. Call sites that are
// already scoped to a specific camp (campId filter present) should query
// CampDonationRecordModel directly — every row there has a camp.

import type { FilterQuery, ProjectionType, Types } from 'mongoose';
import { DonationModel, type Donation } from './donation.model';
import { CampDonationRecordModel } from './camp-donation-record.model';

export const DONATION_MODELS = [DonationModel, CampDonationRecordModel] as const;

/** Picks which collection a donation write belongs in. */
export function resolveDonationModel(campId: string | Types.ObjectId | null | undefined) {
  return campId ? CampDonationRecordModel : DonationModel;
}

export async function findAcrossDonations<T = Donation>(
  filter: FilterQuery<Donation>,
  projection?: ProjectionType<Donation> | null,
) {
  const [inhouse, camp] = await Promise.all([
    DonationModel.find(filter, projection).lean(),
    CampDonationRecordModel.find(filter, projection).lean(),
  ]);
  return [...inhouse, ...camp] as unknown as T[];
}

export async function findOneAcrossDonations<T = Donation>(filter: FilterQuery<Donation>) {
  const [inhouse, camp] = await Promise.all([
    DonationModel.findOne(filter).lean(),
    CampDonationRecordModel.findOne(filter).lean(),
  ]);
  return (inhouse ?? camp ?? null) as unknown as T | null;
}

/** Finds by Mongo _id, trying the in-house collection first. */
export async function findByIdAcrossDonations<T = Donation>(id: string) {
  const inhouse = await DonationModel.findById(id).lean();
  if (inhouse) return inhouse as unknown as T;
  const camp = await CampDonationRecordModel.findById(id).lean();
  return (camp ?? null) as unknown as T | null;
}

/** Returns the model that owns the given Mongo _id, or null if neither does. */
export async function findOwningModel(id: string) {
  const inhouse = await DonationModel.exists({ _id: id });
  if (inhouse) return DonationModel;
  const camp = await CampDonationRecordModel.exists({ _id: id });
  if (camp) return CampDonationRecordModel;
  return null;
}

export async function countAcrossDonations(filter: FilterQuery<Donation>) {
  const [inhouse, camp] = await Promise.all([
    DonationModel.countDocuments(filter),
    CampDonationRecordModel.countDocuments(filter),
  ]);
  return inhouse + camp;
}

export async function existsAcrossDonations(filter: FilterQuery<Donation>) {
  const [inhouse, camp] = await Promise.all([
    DonationModel.exists(filter),
    CampDonationRecordModel.exists(filter),
  ]);
  return Boolean(inhouse || camp);
}

/**
 * $unionWith stage that merges CampDonationRecordModel's collection into an
 * aggregation pipeline run against DonationModel, so a single `.aggregate()`
 * call can cover both physical collections. Usage:
 *   DonationModel.aggregate([donationUnionWithStage(), { $match: ... }, ...])
 */
export function donationUnionWithStage() {
  return { $unionWith: { coll: CampDonationRecordModel.collection.name } };
}

export async function updateManyAcrossDonations(
  filter: FilterQuery<Donation>,
  update: Record<string, unknown>,
) {
  await Promise.all([
    DonationModel.updateMany(filter, update),
    CampDonationRecordModel.updateMany(filter, update),
  ]);
}

export async function distinctAcrossDonations<T = unknown>(
  field: string,
  filter: FilterQuery<Donation>,
) {
  const [inhouse, camp] = await Promise.all([
    DonationModel.distinct(field, filter),
    CampDonationRecordModel.distinct(field, filter),
  ]);
  const merged = new Map<string, T>();
  for (const v of [...inhouse, ...camp] as T[]) {
    merged.set(String(v), v);
  }
  return Array.from(merged.values());
}
