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
    const { siteId, name, description, address, phone, email, staff } =
      req.body;

    if (!siteId || !name || !description || !address || !email || !phone) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }

    // Ensure that we have a user logged in (the req.user._id comes from authentication middleware)
    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ message: "Unauthorized, user not logged in." });
    }

    if (!staff.length > 0) {
      return res.status(400).json({ message: "Staff list cannot be empty." });
    }
    if (staff && staff.length > 0) {
      for (let i = 0; i < staff.length; i++) {
        if (!mongoose.isValidObjectId(staff[i])) {
          return res.status(400).json({ message: "Invalid staff ID" });
        }
      }
    }

    // Create the new site object
    const newSite = new Site({
      siteId,
      name,
      description,
      address,
      contactInfo: {
        phone: phone,
        email: email,
      },
      createdBy: req.user._id, // The user who is creating the site
      lastUpdatedBy: req.user._id,
      staff, // This can be an array of user IDs that are staff members (optional)
    });

    // Save the site to the database
    const savedSite = await newSite.save();

    // Send a success response with the saved site details
    return res.status(201).json({
      message: "Site or Camp created successfully",
      site: savedSite,
    });
  } catch (error) {
    next(error); // Pass any errors to the error handling middleware
  }
};

const updateSite = async (req, res, next) => {
  try {
    const { id } = req.params; // Site ID from the URL
    const { name, description, address, phone, email, staff } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid Site ID" });
    }

    // Ensure the user is logged in
    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ message: "Unauthorized, user not logged in." });
    }

    // Find the site
    const site = await Site.findById(id);
    if (!site) {
      return res.status(404).json({ message: "Site not found" });
    }

    // Update only the fields provided in the request
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
          return res
            .status(400)
            .json({ message: `Invalid staff ID: ${memberId}` });
        }
      }

      site.staff = staff;
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
      .populate('createdBy', 'name phone email') // Populate creator's details (name, email)
      .populate('lastUpdatedBy', 'name phone email') // Populate last updater's details
      .populate('staff', 'name phone email role') // Populate staff details (name, email, role)
      .exec();

    // If the site doesn't exist, return an error
    if (!site) {
      return res.status(404).json({ message: "Site not found" });
    }

    // Return the site details
    return res.status(200).json({
      message: "Site details retrieved successfully",
      site,
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
      .populate("createdBy", "name")
      .populate("lastUpdatedBy", "name")
      .populate("staff", "name");
    //.populate("donorData") 
    //.populate("bagsData"); 

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
      .populate('createdBy', 'name phone email') // Populate creator's details (name, email)
      .populate('lastUpdatedBy', 'name phone email') // Populate last updater's details
      .populate('staff', 'name phone email role') // Populate staff details (name, email, role)
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
    const staffList = await User.find({}, { name: 1 })
      .select('_id name');
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
      return res.status(404).json({ message: 'Invalid Site Id' });
    }

    // Step 1: Find the site by its siteId field
    const site = await Site.findOne({ siteId })
      .select('name siteId bagsData')
      .populate({
        path: 'bagsData',
        select: 'bagNo segmentNo typeOfBag bloodGroup rh status collectionDate donor',
        populate: {
          path: 'donor',
          select: 'name donorId' // Adjust based on actual donor model fields
        }
      });

    // Handle if site is not found
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    return res.status(200).json({
      message: 'Camp donation data fetched successfully.',
      data: {
        siteName: site.name,
        siteId: site.siteId,
        donations: site.bagsData
      }
    });

  } catch (error) {
    console.error('Error in campDonationList:', error);
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
      return res.status(404).json({ message: 'Invalid Site Id' });
    }
    // Step 1: Find the site by custom siteId
    const site = await Site.findOne({ siteId })
      .select('name siteId donorData')
      .populate({
        path: 'donorData',
        select: 'donorId name.firstName name.lastName uid phone email sex bloodGroup rh'
      });

    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    return res.status(200).json({
      message: 'Camp donor list fetched successfully.',
      data: {
        siteName: site.name,
        siteId: site.siteId,
        donors: site.donorData
      }
    });

  } catch (error) {
    console.error('Error in campDonorList:', error);
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
  campDonorList
};
