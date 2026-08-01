"use server";

import connectToDatabase from "@/lib/db";
import Camp from "@/models/camp-model";
import Donation from "@/models/donation-model";

const COMPLETED_CAMP_WINDOW_DAYS = 30;

interface DonationTotal {
  _id: unknown;
  count: number;
}

// Only these fields are safe to send to the public, unauthenticated site.
// Internal references — staff, createdBy, lastUpdatedBy, donorData,
// unitData — must never leave the server: they're raw ObjectIds pointing
// at staff accounts, donor records and blood units, and their presence
// would let anyone poking at the public API enumerate internal record ids.
const PUBLIC_CAMP_PROJECTION = "campId name description address contactInfo dateFrom dateTo donorData";

// Attaches donorCount / donationCount to each camp, then strips the raw
// donorData id array — only the derived count is public-safe.
async function withCounts<T extends { _id: unknown; donorData?: unknown[] }>(camps: T[]) {
  if (camps.length === 0) return [];

  const campIds = camps.map((c) => c._id);
  const donationTotals: DonationTotal[] = await Donation.aggregate([
    { $match: { campId: { $in: campIds }, deletedAt: null } },
    { $group: { _id: "$campId", count: { $sum: 1 } } },
  ]);
  const donationCountByCamp = new Map<string, number>(
    donationTotals.map((d) => [String(d._id), d.count])
  );

  return camps.map((camp) => {
    const { donorData, ...rest } = camp;
    return {
      ...rest,
      donorCount: Array.isArray(donorData) ? donorData.length : 0,
      donationCount: donationCountByCamp.get(String(camp._id)) ?? 0,
    };
  });
}

// Camps with no activity yet (upcoming) never went through withCounts, so
// they still carry the raw donorData array — strip it and zero the counts.
function withoutDonorData<T extends { donorData?: unknown[] }>(camp: T) {
  const { donorData, ...rest } = camp;
  return { ...rest, donorCount: 0, donationCount: 0 };
}

export async function getActiveCamps() {
  try {
    await connectToDatabase();
    const now = new Date();
    // Fetch camps that have not ended yet (covers both ongoing and upcoming —
    // the page splits them client-side by dateFrom vs. now).
    const camps = await Camp.find({
      dateTo: { $gte: now },
    })
      .select(PUBLIC_CAMP_PROJECTION)
      .sort({ dateFrom: 1 })
      .lean();

    // Only ongoing camps (dateFrom already reached) get donor/donation
    // counts — upcoming camps have no activity yet, so skip the extra query.
    const ongoing = camps.filter((c) => new Date(c.dateFrom) <= now);
    const upcoming = camps.filter((c) => new Date(c.dateFrom) > now);
    const ongoingWithCounts = await withCounts(ongoing);
    const upcomingWithoutCounts = upcoming.map(withoutDonorData);
    const merged = [...ongoingWithCounts, ...upcomingWithoutCounts].sort(
      (a, b) => new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime()
    );

    return {
      success: true,
      data: JSON.parse(JSON.stringify(merged)),
    };
  } catch (error: any) {
    console.error("Failed to fetch camps:", error);
    return { success: false, message: error.message };
  }
}

export async function getPastCamps() {
  try {
    await connectToDatabase();
    const now = new Date();
    const windowStart = new Date(now.getTime() - COMPLETED_CAMP_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    // Only camps completed within the last 15 days.
    const camps = await Camp.find({
      dateTo: { $lt: now, $gte: windowStart },
    })
      .select(PUBLIC_CAMP_PROJECTION)
      .sort({ dateFrom: -1 })
      .lean();

    const campsWithCounts = await withCounts(camps);

    return {
      success: true,
      data: JSON.parse(JSON.stringify(campsWithCounts)),
    };
  } catch (error: any) {
    console.error("Failed to fetch past camps:", error);
    return { success: false, message: error.message };
  }
}
