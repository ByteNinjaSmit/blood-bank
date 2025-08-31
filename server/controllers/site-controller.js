/*
Create Site 
Update Site 
Delete Site 
Get Details Of Site (View)
*/

const Site = require("../models/site-model");
const User = require("../models/user-model");
const mongoose = require("mongoose");

const createSite = async (req, res, next) => {
  try {
    // Extracting data from the request body
    const {
      siteId,
      name,
      description,
      address,
      phone,
      email,
      staff,
      dateFrom,
      dateTo,
    } = req.body;

    // Basic validation
    if (
      !siteId ||
      !name ||
      !description ||
      !address ||
      !email ||
      !phone ||
      !dateFrom ||
      !dateTo
    ) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }

    // Ensure that we have a user logged in
    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ message: "Unauthorized, user not logged in." });
    }

    // Validate staff
    if (!staff || staff.length === 0) {
      return res.status(400).json({ message: "Staff list cannot be empty." });
    }
    for (let i = 0; i < staff.length; i++) {
      if (!mongoose.isValidObjectId(staff[i])) {
        return res.status(400).json({ message: "Invalid staff ID" });
      }
    }

    // Validate dates (camp cannot end before it starts)
    if (new Date(dateTo) < new Date(dateFrom)) {
      return res
        .status(400)
        .json({ message: "End date cannot be earlier than start date." });
    }

    // Create the new site object
    const newSite = new Site({
      siteId,
      name,
      description,
      address,
      contactInfo: {
        phone,
        email,
      },
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dateTo),
      createdBy: req.user._id,
      lastUpdatedBy: req.user._id,
      staff,
    });

    // Save the site to the database
    const savedSite = await newSite.save();

    return res.status(201).json({
      message: "Site or Camp created successfully",
      site: savedSite,
    });
  } catch (error) {
    console.error("Error creating site:", error);
    next(error);
  }
};

const updateSite = async (req, res, next) => {
  try {
    const { id } = req.params; // Site ID from the URL
    const { name, description, address, phone, email, staff, dateFrom, dateTo } = req.body;

    // Validate site id
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid Site ID" });
    }

    // Ensure the user is logged in
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized, user not logged in." });
    }

    // Find the site
    const site = await Site.findById(id);
    if (!site) {
      return res.status(404).json({ message: "Site not found" });
    }

    // Update only the fields provided
    if (name) site.name = name;
    if (description !== undefined) site.description = description;
    if (address) site.address = address;
    if (phone) site.contactInfo.phone = phone;
    if (email) site.contactInfo.email = email;

    if (staff) {
      if (!Array.isArray(staff)) {
        return res.status(400).json({ message: "Staff must be an array" });
      }

      for (let memberId of staff) {
        if (!mongoose.isValidObjectId(memberId)) {
          return res.status(400).json({ message: `Invalid staff ID: ${memberId}` });
        }
      }
      site.staff = staff;
    }

    // Handle dateFrom and dateTo
    if (dateFrom) site.dateFrom = new Date(dateFrom);
    if (dateTo) site.dateTo = new Date(dateTo);

    // Validate dates
    if (site.dateFrom && site.dateTo && new Date(site.dateTo) < new Date(site.dateFrom)) {
      return res.status(400).json({ message: "End date cannot be earlier than start date." });
    }

    // Set lastUpdatedBy to the current user
    site.lastUpdatedBy = req.user._id;

    // Save changes
    const updatedSite = await site.save();

    return res.status(200).json({
      message: "Site updated successfully",
      site: updatedSite,
    });
  } catch (error) {
    console.error("Error updating site:", error);
    next(error);
  }
};


const deleteSite = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate the site ID
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid Site ID" });
    }

    // Ensure the user is authenticated
    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ message: "Unauthorized, user not logged in." });
    }

    // Find the site by ID
    const site = await Site.findById(id);

    // If the site doesn't exist, return an error
    if (!site) {
      return res.status(404).json({ message: "Site not found" });
    }

    // Only the creator of the site can delete it
    if (site.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this site." });
    }

    // Proceed with deletion
    await Site.findByIdAndDelete(id);

    // Return success message
    return res.status(200).json({ message: "Site deleted successfully." });
  } catch (error) {
    next(error);
  }
};

const getSiteDetails = async (req, res, next) => {
  try {
    const { id } = req.params; // Site ID from the URL

    // Validate the Site ID
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid Site ID" });
    }

    // Find the site by its ID and populate necessary fields
    const site = await Site.findById(id)
      .select("siteId name description address contactInfo dateFrom dateTo createdBy lastUpdatedBy staff createdAt donorData bagsData")
      .populate("createdBy", "name phone email")
      .populate("lastUpdatedBy", "name phone email")
      .populate("staff", "name phone email role")
      .exec();

    if (!site) {
      return res.status(404).json({ message: "Site not found" });
    }

    // Convert to plain object and remove arrays
    const siteObj = site.toObject();
    delete siteObj.donorData;
    delete siteObj.bagsData;

    // Return only counts instead of full arrays
    return res.status(200).json({
      message: "Site details retrieved successfully",
      site: {
        ...siteObj,
        donorCount: site?.donorData?.length || 0,
        bagsCount: site?.bagsData?.length || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};


// ------------
// GET CAMP LIST
// --------------
const getCampList = async (req, res, next) => {
  try {
    const sites = await Site.find()
      .select(
        "siteId name description address contactInfo dateFrom dateTo createdAt createdBy staff"
      ) // pick fields
      .populate("createdBy", "name") // only name of creator
      .populate("staff", "name"); // only staff names

    return res.status(200).json({
      message: "Site list retrieved successfully",
      data: sites,
    });
  } catch (error) {
    console.error(`Error from getCampList:`, error);
    next(error);
  }
};

const getAllSites = async (req, res, next) => {
  try {
    // Find all sites and populate the necessary fields
    const sites = await Site.find()
      .populate("createdBy", "name phone email") // Populate creator's details (name, email)
      .populate("lastUpdatedBy", "name phone email") // Populate last updater's details
      .populate("staff", "name phone email role") // Populate staff details (name, email, role)
      .exec();

    // If no sites are found, return an error
    if (sites.length === 0) {
      return res.status(404).json({ message: "No sites found" });
    }

    // Return the list of all sites
    return res.status(200).json({
      message: "All sites retrieved successfully",
      sites,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------
// GET Staff List
// -----------------

const getStaffList = async (req, res, next) => {
  try {
    const staffList = await User.find({}, { name: 1 }).select("_id name");
    return res.status(200).json({ success: true, data: staffList });
  } catch (error) {
    console.error("Error fetching staff list:", error);
    next(error);
  }
};

// -----------
// Get List Of Camp Donation
// ------------

const campDonationList = async (req, res, next) => {
  try {
    const { siteId } = req.params;

    if (!mongoose.isValidObjectId(siteId)) {
      return res.status(404).json({ message: "Invalid Site Id" });
    }

    // Step 1: Find the site by its siteId field
    const site = await Site.findOne({ siteId })
      .select("name siteId bagsData")
      .populate({
        path: "bagsData",
        select:
          "bagNo segmentNo typeOfBag bloodGroup rh status collectionDate donor",
        populate: {
          path: "donor",
          select: "name donorId", // Adjust based on actual donor model fields
        },
      });

    // Handle if site is not found
    if (!site) {
      return res.status(404).json({ message: "Site not found" });
    }

    return res.status(200).json({
      message: "Camp donation data fetched successfully.",
      data: {
        siteName: site.name,
        siteId: site.siteId,
        donations: site.bagsData,
      },
    });
  } catch (error) {
    console.error("Error in campDonationList:", error);
    next(error);
  }
};

// ------------------------
// Get List Of Particular Camp Donor
// ----------------------

const campDonorList = async (req, res, next) => {
  try {
    const { siteId } = req.params;
    if (!mongoose.isValidObjectId(siteId)) {
      return res.status(404).json({ message: "Invalid Site Id" });
    }
    // Step 1: Find the site by custom siteId
    const site = await Site.findOne({ siteId })
      .select("name siteId donorData")
      .populate({
        path: "donorData",
        select:
          "donorId name.firstName name.middleName name.lastName dob uid phone email sex bloodGroup rh",
      });

    if (!site) {
      return res.status(404).json({ message: "Site not found" });
    }

    return res.status(200).json({
      message: "Camp donor list fetched successfully.",
      data: {
        siteName: site.name,
        siteId: site.siteId,
        donors: site.donorData,
      },
    });
  } catch (error) {
    console.error("Error in campDonorList:", error);
    next(error);
  }
};

module.exports = {
  createSite,
  updateSite,
  deleteSite,
  getSiteDetails,
  getAllSites,
  getStaffList,
  getCampList,
  campDonationList,
  campDonorList,
};
