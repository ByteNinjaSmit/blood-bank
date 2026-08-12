// CampDonationRecord = the finalized/completed donation event for a camp
// donor. Same shape as Donation (see buildDonationSchema()) but stored in
// a separate collection so camp donations are physically split from
// in-house donations. campId is always set on documents here.
//
// Not to be confused with CampDonation (camp-donation.model.ts, collection
// `campdonations`) — that model is an unrelated draft/pre-registration
// intake form used by the Camp Donor Appointment List screen, filled in
// before a donor is decided fit to donate.

import mongoose, { type Model } from 'mongoose';
import { buildDonationSchema, type Donation } from './donation.model';

export type CampDonationRecord = Donation;
export type CampDonationRecordModel = Model<CampDonationRecord>;
export const CampDonationRecordModel: CampDonationRecordModel =
  (mongoose.models.CampDonationRecord as CampDonationRecordModel | undefined) ??
  mongoose.model<CampDonationRecord>(
    'CampDonationRecord',
    buildDonationSchema(),
    'campdonationrecords',
  );
