/*
POST /donors – Register new donor
GET /donors – List donors (filter by group, eligibility, date range)
GET /donors/:id – Get donor details & donation history
PUT /donors/:id – Update donor info
DELETE /donors/:id – Soft delete donor

*/

const Donor = require("../models/donor-model");
const BloodBag = require("../models/bloodbag-model");
const Component = require("../models/component-model");
const Inventory = require("../models/inventory-model");
const DiscardLog = require("../models/discard-model");
const Site = require("../models/site-model");
const mongoose = require("mongoose");

const registerDonor = async (req, res, next) => {
  try {
    // Extract donor information from request body
    let {
      donorId,
      firstName,
      middleName,
      lastName,
      uid,
      dob,
      sex,
      phone,
      email,
      address,
      occupation,
      weightKg,
      bloodGroup,
      rh,
      eligibilityStatus,
      lastDonationDate,
    } = req.body;

    // Convert email to lowercase if it's provided
    if (email) {
      email = email.toLowerCase();
    }

    // Validate required fields
    if (
      !donorId ||
      !firstName ||
      !lastName ||
      !dob ||
      !sex ||
      !phone ||
      !weightKg ||
      !bloodGroup ||
      !rh ||
      !eligibilityStatus
    ) {
      return res
        .status(400)
        .json({ message: "Please fill in all required fields." });
    }

    // Check for duplicate donor by name and DOB
    const existingDonor = await Donor.findOne({
      "name.firstName": firstName,
      "name.lastName": lastName,
      dob: dob,
      ...(middleName ? { "name.middleName": middleName } : {}),
    });

    if (existingDonor) {
      return res.status(400).json({ message: "Donor already exists." });
    }

    // Validate UID (e.g., 12-digit Aadhaar number)
    if (uid) {
      const uidValid = /^\d{12}$/.test(uid);
      if (!uidValid) {
        return res
          .status(400)
          .json({ message: "Invalid UID. It must be a 12-digit number." });
      }
    }

    // Validate phone number (10 digits)
    const phoneValid = /\d{10}/.test(phone);
    if (!phoneValid) {
      return res.status(400).json({
        message: "Invalid phone number. It must be a 10-digit number.",
      });
    }

    // Validate DOB (check if it's a valid date and the donor is at least 18 years old)
    const dobDate = new Date(dob);
    if (isNaN(dobDate)) {
      return res.status(400).json({ message: "Invalid date of birth." });
    }

    // Create a new donor
    const newDonor = new Donor({
      donorId,
      name: {
        firstName,
        middleName,
        lastName,
      },
      uid: uid || null,
      dob,
      sex,
      phone,
      email,
      address,
      occupation,
      weightKg,
      bloodGroup,
      rh,
      eligibilityStatus,
      lastDonationDate,
      createdBy: req.user._id, // Assuming req.user._id comes from authentication middleware
      updatedBy: req.user._id, // Set initially to the current user
    });

    // Save the donor to the database
    await newDonor.save();

    // Return success response
    return res.status(201).json({
      message: "Donor registered successfully.",
      donor: newDonor,
    });
  } catch (error) {
    next(error); // Pass the error to the error handling middleware
  }
};

// ------------------
// Update Donor
// ------------------
const updateDonor = async (req, res, next) => {
  try {
    const { id } = req.params; // Donor ID from the URL
    let {
      donorId,
      name,
      uid,
      dob,
      sex,
      phone,
      email,
      address,
      occupation,
      weightKg,
      bloodGroup,
      rh,
      eligibilityStatus,
      lastDonationDate,
    } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Donor ID Invalid." });
    }

    // Find the donor by ID
    const donor = await Donor.findById(id);
    if (!donor) {
      return res.status(404).json({ message: "Donor not found." });
    }
    // Convert email to lowercase if it's provided
    email = email ? email.toLowerCase() : undefined;
    // Check if the donor ID or UID already exists (optional validation)
    if (donor.donorId !== donorId) {
      const existingDonor = await Donor.findOne({ donorId });
      if (existingDonor) {
        return res.status(400).json({ message: "Donor ID already exists." });
      }
    }

    if (donor.uid !== uid) {
      const existingUID = await Donor.findOne({ uid });
      if (existingUID) {
        return res.status(400).json({ message: "UID already exists." });
      }
    }

    // Update only the fields that are provided
    if (donorId) donor.donorId = donorId;
    if (name) donor.name = { ...donor.name, ...name }; // Update the name fields if provided
    if (uid) donor.uid = uid;
    if (dob) donor.dob = dob;
    if (sex) donor.sex = sex;
    if (phone) donor.phone = phone;
    if (email) donor.email = email.toLowerCase(); // Convert email to lowercase
    if (address) donor.address = address;
    if (occupation) donor.occupation = occupation;
    if (weightKg) donor.weightKg = weightKg;
    if (bloodGroup) donor.bloodGroup = bloodGroup;
    if (rh) donor.rh = rh;
    if (eligibilityStatus) donor.eligibilityStatus = eligibilityStatus;
    if (lastDonationDate) donor.lastDonationDate = lastDonationDate;

    // Update the `updatedBy` and `updatedAt` fields
    donor.updatedBy = req.user._id; // Assuming `req.user._id` comes from authentication middleware
    donor.updatedAt = new Date();

    // Save the updated donor to the database
    await donor.save();

    // Return the updated donor details
    return res.status(200).json({
      message: "Donor updated successfully.",
      donor,
    });
  } catch (error) {
    next(error); // Pass any errors to the error handling middleware
  }
};

// ------------------
// Safe Delete Donor (block if donations exist)
// ------------------
const deleteDonor = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Donor ID Invalid." });
    }

    const donor = await Donor.findById(id).select("donationHistory");
    if (!donor) {
      return res.status(404).json({ message: "Donor not found." });
    }

    if (Array.isArray(donor.donationHistory) && donor.donationHistory.length > 0) {
      return res.status(409).json({
        code: "DONOR_HAS_DONATIONS",
        message:
          "Donor has donation history and cannot be deleted. Contact an administrator to force delete if necessary.",
      });
    }

    await Donor.findByIdAndDelete(id);

    return res.status(200).json({ message: "Donor deleted successfully." });
  } catch (error) {
    next(error);
  }
};

const getDonorDetails = async (req, res, next) => {
  try {
    const { id } = req.params; // Donor ID from the URL

    // Check if the provided ID is a valid MongoDB ObjectId
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid donor ID format." });
    }

    // Fetch the donor from the database
    const donor = await Donor.findById(id)
      .populate("createdBy", "name phone") // Populate the creator's details
      .populate("updatedBy", "name phone") // Populate the last updater's details
      .populate("donationHistory.donationId") // Populate donation history with related donation details (if any)
      .exec();

    // If no donor found, return 404
    if (!donor) {
      return res.status(404).json({ message: "Donor not found." });
    }

    // Return the donor details
    return res.status(200).json({
      donor,
    });
  } catch (error) {
    next(error); // Pass any errors to the error handling middleware
  }
};

const listDonors = async (req, res, next) => {
  try {
    // Destructuring query parameters
    const {
      bloodGroup,
      eligibilityStatus,
      startDate,
      endDate,
      page = 1, // Default to page 1 if not provided
      limit = 10, // Default to 10 results per page
      sortBy = "createdAt", // Default sorting by creation date
      sortOrder = "desc", // Default to descending order
    } = req.query;

    // Construct the filter query
    let filter = {};

    if (bloodGroup) {
      filter.bloodGroup = bloodGroup;
    }

    if (eligibilityStatus) {
      filter.eligibilityStatus = eligibilityStatus;
    }

    if (startDate && endDate) {
      filter.lastDonationDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Pagination: skip (for previous pages) and limit (for page size)
    const skip = (page - 1) * limit;
    const limitResults = parseInt(limit);

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1; // -1 for descending, 1 for ascending

    // Fetch the donors with the constructed filter, pagination, and sorting
    const donors = await Donor.find(filter)
      .skip(skip)
      .limit(limitResults)
      .sort(sort)
      .populate("createdBy", "name phone") // Optionally populate creator's details
      .populate("updatedBy", "name phone") // Optionally populate last updater's details
      .exec();

    // Count the total number of donors matching the filter
    const totalCount = await Donor.countDocuments(filter);

    // Return paginated result and total count
    return res.status(200).json({
      totalCount,
      page,
      limit: limitResults,
      donors,
    });
  } catch (error) {
    next(error); // Pass any errors to the error handling middleware
  }
};




// ---------------------
// SEARCH Donor by flexible criteria and get Latest Donation
// Supports:
//   - Name + DOB (firstName, lastName, optional middleName, dob)
//   - OR any of: uid, phone, donorId
// ---------------------
const searchDonorLatestDonation = async (req, res, next) => {
  try {
    const { firstName, middleName, lastName, dob, uid, phone, donorId } = req.query;

    const hasNameDob = firstName && lastName && dob;
    const hasStrongIdentifier = uid || phone || donorId;

    // Enforce at least one valid search strategy to avoid full-collection scans
    if (!hasNameDob && !hasStrongIdentifier) {
      return res.status(400).json({
        message:
          "Provide either firstName, lastName and dob, or at least one of phone, uid, donorId to search donor.",
      });
    }

    // Build dynamic search query using any provided fields
    const searchQuery = {};
    if (firstName) {
      searchQuery["name.firstName"] = { $regex: `^${firstName.trim()}`, $options: "i" };
    }
    if (middleName) {
      searchQuery["name.middleName"] = { $regex: `^${middleName.trim()}`, $options: "i" };
    }
    if (lastName) {
      searchQuery["name.lastName"] = { $regex: `^${lastName.trim()}`, $options: "i" };
    }
    if (dob) {
      const dobDate = new Date(dob);
      if (isNaN(dobDate)) {
        return res.status(400).json({ message: "Invalid dob format." });
      }
      searchQuery.dob = dobDate;
    }
    if (uid) {
      searchQuery.uid = uid;
    }
    if (phone) {
      searchQuery.phone = phone;
    }
    if (donorId) {
      searchQuery.donorId = donorId;
    }

    const donor = await Donor.findOne(searchQuery)
      .populate({
        path: "donationHistory.donationId",
        select: "bagNo segmentNo typeOfBag bloodGroup rh collectionDate expiryDate status",
        model: "BloodBag",
      })
      .populate({
        path: "createdBy updatedBy",
        select: "name.first name.last phone",
        model: "User",
      })
      .select("-__v");

    if (!donor) {
      return res.status(404).json({ message: "Donor not found." });
    }

    // Get latest donation by comparing date or populated collectionDate
    let latestDonation = null;
    if (Array.isArray(donor.donationHistory) && donor.donationHistory.length > 0) {
      latestDonation = donor.donationHistory.reduce((latest, current) => {
        const latestTime = new Date(latest?.date || latest?.donationId?.collectionDate || 0).getTime();
        const currentTime = new Date(current?.date || current?.donationId?.collectionDate || 0).getTime();
        return currentTime >= latestTime ? current : latest;
      }, null);
    }

    return res.status(200).json({
      message: "Donor details with latest donation fetched successfully.",
      donor: {
        _id: donor._id,
        donorId: donor.donorId,
        name: donor.name,
        uid: donor.uid,
        dob: donor.dob,
        sex: donor.sex,
        phone: donor.phone,
        email: donor.email,
        address: donor.address,
        occupation: donor.occupation,
        weightKg: donor.weightKg,
        bloodGroup: donor.bloodGroup,
        rh: donor.rh,
        eligibilityStatus: donor.eligibilityStatus,
        lastDonationDate: donor.lastDonationDate,
        createdAt: donor.createdAt,
        createdBy: donor.createdBy,
        updatedAt: donor.updatedAt,
        updatedBy: donor.updatedBy,
        latestDonation: latestDonation
          ? {
              donorId: latestDonation.donorId,
              bagNo: latestDonation.bagNo,
              date: latestDonation.date,
              donationId: latestDonation.donationId,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Error in searchDonorLatestDonation:", error);
    next(error);
  }
};

// ------------------
// Force Delete Donor with Cascade (admin / privileged only)
// ------------------
const forceDeleteDonor = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Donor ID Invalid." });
    }

    const donor = await Donor.findById(id);
    if (!donor) {
      return res.status(404).json({ message: "Donor not found." });
    }

    const user = req.user;
    const isAdmin = user?.role === "admin";
    const perms = user?.permissions || [];
    const canDeleteModule = perms.some((p) =>
      ["donor", "donors", "donor management"].includes(String(p.moduleName || "").toLowerCase()) && p.delete
    );

    if (!isAdmin && !canDeleteModule) {
      return res.status(403).json({ message: "You do not have permission to force delete donors." });
    }

    // Find all blood bags linked to this donor
    const bags = await BloodBag.find({ donor: id }).select("_id");
    const bagIds = bags.map((b) => b._id);

    // Find all components derived from those bags
    const components = await Component.find({ donationId: { $in: bagIds } }).select("_id");
    const componentIds = components.map((c) => c._id);

    // Delete discard logs related to these bags or components
    await DiscardLog.deleteMany({
      $or: [{ bagNo: { $in: bagIds } }, { componentId: { $in: componentIds } }],
    });

    // Delete inventory entries for these bags
    await Inventory.deleteMany({ bagNo: { $in: bagIds } });

    // Delete components
    await Component.deleteMany({ donationId: { $in: bagIds } });

    // Delete blood bags
    await BloodBag.deleteMany({ _id: { $in: bagIds } });

    // Detach donor and bags from sites
    await Site.updateMany(
      {},
      {
        $pull: {
          bagsData: { $in: bagIds },
          donorData: donor._id,
        },
      }
    );

    // Finally delete donor
    await Donor.findByIdAndDelete(id);

    return res.status(200).json({ message: "Donor and all related data deleted successfully." });
  } catch (error) {
    console.error("Error in forceDeleteDonor:", error);
    next(error);
  }
};

module.exports = {
  registerDonor,
  updateDonor,
  getDonorDetails,
  listDonors,
  searchDonorLatestDonation,
  deleteDonor,
  forceDeleteDonor,
};
