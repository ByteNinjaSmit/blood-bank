/*
POST /donors – Register new donor
GET /donors – List donors (filter by group, eligibility, date range)
GET /donors/:id – Get donor details & donation history
PUT /donors/:id – Update donor info
DELETE /donors/:id – Soft delete donor

*/

const Donor = require("../models/donor-model");
const mongoose = require("mongoose");

const registerDonor = async (req, res, next) => {
    try {
        // Extract donor information from request body
        const {
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
        email = email ? email.toLowerCase() : undefined;

        // Validate required fields
        if (
            !donorId ||
            !firstName ||
            !middleName ||
            !lastName ||
            !uid ||
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

        // Validate UID (e.g., 12-digit Aadhaar number)
        const uidValid = /\d{12}/.test(uid);
        if (!uidValid) {
            return res
                .status(400)
                .json({ message: "Invalid UID. It must be a 12-digit number." });
        }

        if (existingDonor) {
            return res
                .status(400)
                .json({ message: "Donor with this UID already exists." });
        }

        // Validate phone number (10 digits)
        const phoneValid = /\d{10}/.test(phone);
        if (!phoneValid) {
            return res
                .status(400)
                .json({
                    message: "Invalid phone number. It must be a 10-digit number.",
                });
        }

        // Validate DOB (check if it's a valid date and the donor is at least 18 years old)
        const dobDate = new Date(dob);
        if (isNaN(dobDate)) {
            return res.status(400).json({ message: "Invalid date of birth." });
        }

        // Check if the donor with this UID already exists
        const existingDonor = await Donor.findOne({ uid });

        // Create a new donor
        const newDonor = new Donor({
            donorId,
            name: {
                firstName: firstName,
                middleName: middleName,
                lastName: lastName,
            },
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
        const {
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



const getDonorDetails = async (req, res, next) => {
  try {
    const { id } = req.params; // Donor ID from the URL

    // Check if the provided ID is a valid MongoDB ObjectId
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid donor ID format." });
    }

    // Fetch the donor from the database
    const donor = await Donor.findById(id)
      .populate('createdBy', 'name email')  // Populate the creator's details
      .populate('updatedBy', 'name email')  // Populate the last updater's details
      .populate('donationHistory.donationId')  // Populate donation history with related donation details (if any)
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
    next(error);  // Pass any errors to the error handling middleware
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
      sortBy = 'createdAt', // Default sorting by creation date
      sortOrder = 'desc', // Default to descending order
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
      filter.lastDonationDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    // Pagination: skip (for previous pages) and limit (for page size)
    const skip = (page - 1) * limit;
    const limitResults = parseInt(limit);

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1; // -1 for descending, 1 for ascending

    // Fetch the donors with the constructed filter, pagination, and sorting
    const donors = await Donor.find(filter)
      .skip(skip)
      .limit(limitResults)
      .sort(sort)
      .populate('createdBy', 'name email') // Optionally populate creator's details
      .populate('updatedBy', 'name email') // Optionally populate last updater's details
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
    next(error);  // Pass any errors to the error handling middleware
  }
};



module.exports = {
    registerDonor,
    updateDonor,
    getDonorDetails,
    listDonors,
};
