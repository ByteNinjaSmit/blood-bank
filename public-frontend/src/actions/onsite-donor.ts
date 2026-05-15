"use server";

// This action is ready to be connected to your backend API
// You can use fetch() or axios here to send data to your FastAPI/NodeJS server

interface OnSiteRegistrationData {
    // Donor Fields
    firstName: string;
    middleName?: string;
    lastName: string;
    uid: string;
    dob: string;
    sex: string;
    phone: string;
    email?: string;
    addressLine1: string;
    city: string;
    district: string;
    state: string;
    pincode: string;
    bloodGroup: string;
    rh: string;
    weightKg: string | number;
    occupation?: string;
    
    // Donation Fields
    bagNo: string;
    segmentNo: string;
    batchNo: string;
    typeOfBag: string;
    hb: string | number;
    pulse: string | number;
    tempC: string | number;
    bp: string;
    donorIsFit: string | boolean;
    rejectionReason?: string;
    siteId: string;
}

export async function registerOnSiteDonor(data: OnSiteRegistrationData) {
    try {
        console.log("OnSite Registration received on server:", data);
        
        // Example API call:
        /*
        const response = await fetch(`${process.env.BACKEND_URL}/api/onsite/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Failed to register");
        return await response.json();
        */

        // For now, we simulate success
        return { 
            success: true, 
            message: "OnSite Donor and Donation registered successfully",
            donorId: `DNR-${Math.floor(Date.now() / 1000)}` 
        };
    } catch (error: any) {
        console.error("OnSite Registration Error:", error);
        return { 
            success: false, 
            message: error.message || "Internal server error during registration" 
        };
    }
}
