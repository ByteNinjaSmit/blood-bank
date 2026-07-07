"use server";

import connectToDatabase from "@/lib/db";
import Camp from "@/models/camp-model";
import Donation from "@/models/donation-model";

const COMPLETED_CAMP_WINDOW_DAYS = 30;

interface DonationTotal {
  _id: unknown;
  count: number;
}

// Attaches donorCount / donationCount to each camp. Donor count comes
// straight off the denormalized donorData array; donation count is a
// single grouped aggregate across all camps to avoid N+1 queries.
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

  return camps.map((camp) => ({
    ...camp,
    donorCount: Array.isArray(camp.donorData) ? camp.donorData.length : 0,
    donationCount: donationCountByCamp.get(String(camp._id)) ?? 0,
  }));
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
      .sort({ dateFrom: 1 })
      .lean();

    // Only ongoing camps (dateFrom already reached) get donor/donation
    // counts — upcoming camps have no activity yet, so skip the extra query.
    const ongoing = camps.filter((c) => new Date(c.dateFrom) <= now);
    const upcoming = camps.filter((c) => new Date(c.dateFrom) > now);
    const ongoingWithCounts = await withCounts(ongoing);
    const merged = [...ongoingWithCounts, ...upcoming].sort(
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
