"use server";

import connectToDatabase from "@/lib/db";
import Site from "@/models/site-model";

export async function getActiveCamps() {
  try {
    await connectToDatabase();
    const now = new Date();
    // Fetch camps that have not ended yet
    const camps = await Site.find({
      dateTo: { $gte: now }
    })
    .sort({ dateFrom: 1 })
    .lean();

    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(camps)) 
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
    // Fetch camps that have already ended
    const camps = await Site.find({
      dateTo: { $lt: now }
    })
    .sort({ dateFrom: -1 })
    .lean();

    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(camps)) 
    };
  } catch (error: any) {
    console.error("Failed to fetch past camps:", error);
    return { success: false, message: error.message };
  }
}
