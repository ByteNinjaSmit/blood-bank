/*
POST /components/separate – Separate components from donation
GET /components – List components (filter by type/status/expiry)
GET /components/:id – Get component details
PATCH /components/:id/status – Update status (e.g., reserve/issue/discard)
POST /components/:id/print-label – Generate & print component label
*/

const Component = require('../models/component-model');
const BloodBag = require('../models/bloodbag-model');
const Site = require('../models/site-model');
const Inventory = require('../models/inventory-model');
const mongoose = require('mongoose');
const logger = require('../utils/logger');



const separateComponents = async (req, res, next) => {
  try {
    const {
      donationId,
      componentType,
      volumeMl,
    } = req.body;

    const userId = req?.user?._id;

    // Step 1: Validate input
    if (!donationId || !componentType || !volumeMl) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (!mongoose.isValidObjectId(donationId)) {
      return res.status(400).json({ message: "Invalid Donation ID." });
    }

    // Step 2: Retrieve the blood bag and its associated siteId
    const bloodBag = await BloodBag.findById(donationId).populate('siteId');
    if (!bloodBag) {
      return res.status(404).json({ message: "Blood bag not found." });
    }

    // Get siteId from blood bag
    const siteId = bloodBag.siteId ? bloodBag.siteId._id : null;

    // Optional: Check if the component is already separated for this donation
    const existingComponent = await Component.findOne({
      donationId,
      componentType,
    });

    if (existingComponent) {
      return res.status(400).json({ message: `${componentType} already separated for this donation.` });
    }

    // Step 3: Generate a unique component ID based on componentType and bagNo
    const componentId = `${componentType}-${bloodBag.bagNo}`;

    // Step 4: Calculate the expiry date based on component type
    let expiryDate;
    switch (componentType) {
      case 'RBC':
        expiryDate = new Date(bloodBag.collectionDate);
        expiryDate.setDate(expiryDate.getDate() + 42); // RBC expiry is 42 days
        break;
      case 'FFP':
        expiryDate = new Date(bloodBag.collectionDate);
        expiryDate.setDate(expiryDate.getDate() + 365); // FFP expiry is 1 year (365 days)
        break;
      case 'Platelet':
        expiryDate = new Date(bloodBag.collectionDate);
        expiryDate.setDate(expiryDate.getDate() + 5); // Platelets expiry is 5 days
        break;
      case 'Cryo':
        expiryDate = new Date(bloodBag.collectionDate);
        expiryDate.setDate(expiryDate.getDate() + 365); // Cryo expiry is 1 year (365 days)
        break;
      default:
        return res.status(400).json({ message: "Invalid component type." });
    }

    // Step 5: Create the new component
    const newComponent = await Component.create({
      componentId,
      donationId,
      componentType,
      volumeMl,
      expiryDate,
      status: 'lab-testing',
      batchNo: bloodBag.batchNo || null,
      siteId: siteId,
      createdBy: userId,
      updatedBy: userId,
    });

    // Step 6: Add the new component to the blood bag's components array
    bloodBag.components.push(newComponent._id);
    // bloodBag.componentSeparationComplete = true; // Can modify this logic based on the requirement
    bloodBag.updatedBy = userId;
    await bloodBag.save();

    // Step 7: Return success response
    return res.status(201).json({
      message: "Component separated successfully.",
      component: newComponent,
    });

  } catch (error) {
    next(error);
  }
};

// ----------------
// GET BAGS TO SEPARATE COMPONENT
// ----------------

const getBagsToSeparateComponent = async (req, res, next) => {
  try {
    // Step 1: Fetch blood bags with "collected" status
    const bags = await BloodBag.find({
      status: 'collected',
      componentSeparationComplete: false
    })
      .populate({
        path: 'components',
        select: 'componentType volumeMl',  // Only populate componentType and volumeMl
        model: 'Component'
      })
      .populate({
        path: 'siteId',  // Populate siteId with site name
        select: 'name',  // Only select name field from the Site model
        model: 'Site'
      })
      .select('bagNo segmentNo collectionDate bloodGroup rh components siteId componentSeparationComplete medicalExamination'); // Fields to return from BloodBag

    // Step 2: Check if there are no bags to separate
    if (!bags || bags.length === 0) {
      return res.status(404).json({ message: "No collected blood bags found." });
    }

    // Step 3: Send the list of collected bags with their component details
      return res.status(200).json({
      message: "Blood bags ready for component separation.",
      bags: bags.map(bag => ({
        bagNo: bag.bagNo,
        segmentNo: bag.segmentNo,
        collectionDate: bag.collectionDate,
        bloodGroup: bag.bloodGroup,
        rh: bag.rh,
        volumeGmMl: bag.medicalExamination ? bag.medicalExamination.volumeGmMl : null,
        siteName: bag.siteId ? bag.siteId.name : null,
        componentSeparationComplete: bag.componentSeparationComplete,
        components: bag.components.map(component => ({
          componentType: component.componentType,
          volumeMl: component.volumeMl
        }))
      }))
    });

  } catch (error) {
    next(error);
  }
};

// ----------------------
// Set Status to As Components Separation Completed
// ---------------------


const separationCompleted = async (req, res, next) => {
  try {
    const { donationId } = req.body;
    if (!donationId) {
      return res.status(400).json({ message: "donationId is required." });
    }
    if (!mongoose.isValidObjectId(donationId)) {
      return res.status(400).json({ message: "DonationId is Invalid" });
    }

    const bagExist = await BloodBag.findById(donationId);
    if (!bagExist) {
      return res.status(400).json({ message: "Bag Not Found." });
    }

    bagExist.status = "component-separated";
    bagExist.componentSeparationComplete = true;
    await bagExist.save();

    return res.status(200).json({ message: `${bagExist.bagNo} Component Separation is Completed.` });
  } catch (error) {
    console.log(`Error in Stop Separation`);
    next(error)
  }
}

// -------------------------
// GET COMPONENTS LIST WITH PAGINATION
// ----------------------------

const getComponentsList = async (req, res, next) => {
  try {
    const { type, status, expiryBefore, fromDate, toDate, search, page = 1, limit = 10 } = req.query; // pagination + filters

    // Build filter object
    const filter = {};
    if (type) filter.componentType = type;
    if (status) filter.status = status;
    if (expiryBefore) filter.expiryDate = { $lte: new Date(expiryBefore) };

    // Add Date Range Filter (CreatedAt)
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(new Date(fromDate).setHours(0, 0, 0, 0));
      if (toDate) filter.createdAt.$lte = new Date(new Date(toDate).setHours(23, 59, 59, 999));
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build aggregation pipeline for search functionality
    let pipeline = [
      {
        $lookup: {
          from: "bloodbags",
          localField: "donationId",
          foreignField: "_id",
          as: "donationData"
        }
      },
      {
        $lookup: {
          from: "sites",
          localField: "siteId",
          foreignField: "_id",
          as: "siteData"
        }
      },
      {
        $unwind: {
          path: "$donationData",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: "$siteData",
          preserveNullAndEmptyArrays: true
        }
      }
    ];

    // Add search filter if provided
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { componentId: { $regex: search, $options: "i" } },
            { "donationData.bagNo": { $regex: search, $options: "i" } }
          ]
        }
      });
    }

    // Add other filters
    if (Object.keys(filter).length > 0) {
      pipeline.push({ $match: filter });
    }

    // Add sorting, pagination, and projection
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },
      {
        $project: {
          componentId: 1,
          componentType: 1,
          volumeMl: 1,
          expiryDate: 1,
          status: 1,
          createdAt: 1,
          bagNo: "$donationData.bagNo",
          bloodGroup: { $concat: ["$donationData.bloodGroup", " ", "$donationData.rh"] },
          collectionDate: "$donationData.collectionDate",
          site: "$siteData.name"
        }
      }
    );

    // Execute aggregation
    const components = await Component.aggregate(pipeline);

    // Count total for pagination (separate query for search)
    let countPipeline = [
      {
        $lookup: {
          from: "bloodbags",
          localField: "donationId",
          foreignField: "_id",
          as: "donationData"
        }
      },
      {
        $unwind: {
          path: "$donationData",
          preserveNullAndEmptyArrays: true
        }
      }
    ];

    if (search) {
      countPipeline.push({
        $match: {
          $or: [
            { componentId: { $regex: search, $options: "i" } },
            { "donationData.bagNo": { $regex: search, $options: "i" } }
          ]
        }
      });
    }

    if (Object.keys(filter).length > 0) {
      countPipeline.push({ $match: filter });
    }

    countPipeline.push({ $count: "total" });

    const countResult = await Component.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    if (!components || components.length === 0) {
      return res.status(200).json({
        message: "No components found.",
        pagination: {
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: 0,
        },
        components: []
      });
    }

    // Format response for table
    const tableData = components.map(c => ({
      id:c._id,
      componentId: c.componentId,
      type: c.componentType,
      volumeMl: c.volumeMl,
      status: c.status,
      expiryDate: c.expiryDate,
      bagNo: c.bagNo || null,
      bloodGroup: c.bloodGroup || null,
      collectionDate: c.collectionDate || null,
      site: c.site || null,
      createdAt: c.createdAt,
    }));

    return res.status(200).json({
      message: "Components list fetched successfully.",
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
      components: tableData
    });
  } catch (error) {
    console.log(`Error in getComponentsList:`, error);
    next(error);
  }
};



// -------------------------
// GET COMPONENT DETAILS (with populated objects)
// ----------------------------

const getComponentDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid Component ID." });
    }

    // Find component and populate related data
    const component = await Component.findById(id)
      .populate({
        path: "donationId",
        populate: {
          path: "donor",
          select: "name.firstName name.middleName name.lastName dob sex phone",
          model: "Donor"
        },
        select: "bagNo bloodGroup rh collectionDate status siteId"
      })
      .populate({
        path: "siteId",
        select: "name address",
        model: "Site"
      })
      .populate({
        path: "createdBy",
        select: "name.first name.last phone email",
        model: "User"
      })
      .populate({
        path: "updatedBy",
        select: "name.first name.last phone email",
        model: "User"
      });

    if (!component) {
      return res.status(404).json({ message: "Component not found." });
    }

    // Send directly with populated objects
    return res.status(200).json({
      message: "Component details fetched successfully.",
      component: {
        componentId: component.componentId,
        type: component.componentType,
        volumeMl: component.volumeMl,
        status: component.status,
        expiryDate: component.expiryDate,
        batchNo: component.batchNo,
        rSeriesId: component.rSeriesId,
        storageLocation: component.storageLocation,

        site: component.siteId || null, // populated site object

        bloodBag: component.donationId
          ? {
            bagNo: component.donationId.bagNo,
            bloodGroup: `${component.donationId.bloodGroup} ${component.donationId.rh}`,
            collectionDate: component.donationId.collectionDate,
            expiryDate: component.donationId.expiryDate,
            status: component.donationId.status,
            site: component.donationId.siteId, // ObjectId or populated Site if needed
            donor: component.donationId.donor || null, // populated donor object
          }
          : null,

        createdAt: component.createdAt,
        createdBy: component.createdBy || null, // populated user object
        updatedAt: component.updatedAt,
        updatedBy: component.updatedBy || null, // populated user object
      }
    });
  } catch (error) {
    console.log(`Error in getComponentDetails:`, error);
    next(error);
  }
};


// -------------------------
// GET NEAR EXPIRY COMPONENTS (type-aware thresholds + riskLevel + dynamic filters)
// ----------------------------

const getNearExpiryComponents = async (req, res, next) => {
  try {
    const today = new Date();

    // Type-specific thresholds (days left)
    const thresholds = {
      Platelet: 1,   // Platelets expire fast → critical if ≤ 1 day left
      RBC: 7,        // RBCs near expiry if ≤ 7 days
      FFP: 30,       // Frozen Plasma → 30 days threshold
      Cryo: 30       // Cryoprecipitate → 30 days threshold
    };

    // Dynamic filters from request (optional)
    const { type, status = "in-stock", site, page = 1, limit = 10, search, days = 7 } = req.query;
    const filter = {};
    if (type) filter.componentType = type;
    if (status) filter.status = status;
    if (site) filter.siteId = site;

    // Calculate expiry threshold based on days parameter
    const daysThreshold = parseInt(days);
    const expiryThreshold = new Date();
    expiryThreshold.setDate(expiryThreshold.getDate() + daysThreshold);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build aggregation pipeline for search functionality
    let pipeline = [
      {
        $lookup: {
          from: "bloodbags",
          localField: "donationId",
          foreignField: "_id",
          as: "donationData"
        }
      },
      {
        $lookup: {
          from: "sites",
          localField: "siteId",
          foreignField: "_id",
          as: "siteData"
        }
      },
      {
        $unwind: {
          path: "$donationData",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: "$siteData",
          preserveNullAndEmptyArrays: true
        }
      }
    ];

    // Add search filter if provided
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { componentId: { $regex: search, $options: "i" } },
            { "donationData.bagNo": { $regex: search, $options: "i" } }
          ]
        }
      });
    }

    // Add other filters
    if (Object.keys(filter).length > 0) {
      pipeline.push({ $match: filter });
    }

    // Add expiry date filter at database level for better performance
    pipeline.push({
      $match: {
        expiryDate: {
          $gte: today, // Not expired
          $lte: expiryThreshold // Within the specified days threshold
        }
      }
    });

    // Add sorting and projection
    pipeline.push(
      { $sort: { expiryDate: 1 } },
      {
        $project: {
          _id: 1,
          componentId: 1,
          componentType: 1,
          volumeMl: 1,
          expiryDate: 1,
          status: 1,
          bagNo: "$donationData.bagNo",
          bloodGroup: { $concat: ["$donationData.bloodGroup", " ", "$donationData.rh"] },
          collectionDate: "$donationData.collectionDate",
          site: "$siteData.name"
        }
      }
    );

    // Execute aggregation
    const allComponents = await Component.aggregate(pipeline);

    // Filter dynamically and add riskLevel
    const nearExpiryComponents = allComponents
      .map(c => {
        const daysLeft = Math.ceil((c.expiryDate - today) / (1000 * 60 * 60 * 24));
        
        // Use the dynamic days threshold from the request
        const threshold = daysThreshold;

        // Skip if not near expiry (expired or beyond threshold)
        if (daysLeft > threshold || daysLeft < 0) return null;

        // Assign risk levels based on days left
        let riskLevel = "warning";
        if (daysLeft <= 1) {
          riskLevel = "critical";
        } else if (daysLeft <= 3) {
          riskLevel = "high";
        }

        return {
          id: c._id, // Add MongoDB _id for frontend modal
          componentId: c.componentId,
          type: c.componentType,
          volumeMl: c.volumeMl,
          status: c.status,
          expiryDate: c.expiryDate,
          daysLeft,
          riskLevel,
          bagNo: c.bagNo || null,
          bloodGroup: c.bloodGroup || null,
          collectionDate: c.collectionDate || null,
          site: c.site || null,
        };
      })
      .filter(Boolean); // remove nulls

    // Apply pagination
    const total = nearExpiryComponents.length;
    const paginatedComponents = nearExpiryComponents.slice(skip, skip + parseInt(limit));

    if (!paginatedComponents || paginatedComponents.length === 0) {
      return res.status(200).json({
        message: "No near-expiry components found.",
        pagination: {
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: 0,
        },
        components: []
      });
    }

    return res.status(200).json({
      message: "Near-expiry components fetched successfully.",
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
      components: paginatedComponents
    });
  } catch (error) {
    console.log(`Error in getNearExpiryComponents:`, error);
    next(error);
  }
};



module.exports = {
  separateComponents,
  getBagsToSeparateComponent,
  separationCompleted,
  getComponentsList,
  getComponentDetails,
  getNearExpiryComponents,
};

