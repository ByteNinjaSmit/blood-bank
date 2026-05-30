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

    // Block Platelet and Cryo for Double Bag (DB)
    if (bloodBag.typeOfBag === "DB" && (componentType === "Platelet" || componentType === "Cryo")) {
      return res.status(400).json({ message: "Platelet and Cryo preparation are not allowed for a Double Bag." });
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
      lotNo: bloodBag.lotNo || null,
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
      .select('bagNo segmentNo collectionDate bloodGroup rh components siteId componentSeparationComplete medicalExamination typeOfBag'); // Fields to return from BloodBag

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
        typeOfBag: bag.typeOfBag || null,
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
    const { donationId, signature } = req.body;
    if (!donationId) {
      return res.status(400).json({ message: "donationId is required." });
    }
    if (!signature || !signature.trim()) {
      return res.status(400).json({ message: "Verification signature is required." });
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
    bagExist.separationVerifiedBy = req.user?._id;
    bagExist.separationVerifiedSignature = signature.trim();
    bagExist.separationVerifiedAt = new Date();
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

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build aggregation pipeline to query from BloodBag
    let pipeline = [
      {
        $lookup: {
          from: "components",
          localField: "components",
          foreignField: "_id",
          as: "populatedComponents"
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
          path: "$siteData",
          preserveNullAndEmptyArrays: true
        }
      }
    ];

    // Filter by type if provided (only show bags with that component prepared)
    if (type) {
      pipeline.push({
        $match: {
          "populatedComponents.componentType": type
        }
      });
    }

    // Filter by status if provided (only show bags with a component having this status)
    if (status) {
      pipeline.push({
        $match: {
          "populatedComponents.status": status
        }
      });
    }

    // Filter by expiryBefore if provided (only show bags with a component expiring before this date)
    if (expiryBefore) {
      pipeline.push({
        $match: {
          "populatedComponents.expiryDate": { $lte: new Date(expiryBefore) }
        }
      });
    }

    // Search filter (bag number, blood group, etc.)
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { bagNo: { $regex: search, $options: "i" } },
            { bloodGroup: { $regex: search, $options: "i" } }
          ]
        }
      });
    }

    // Created range filters
    if (fromDate || toDate) {
      const dateFilter = {};
      if (fromDate) dateFilter.$gte = new Date(new Date(fromDate).setHours(0, 0, 0, 0));
      if (toDate) dateFilter.$lte = new Date(new Date(toDate).setHours(23, 59, 59, 999));
      pipeline.push({
        $match: {
          createdAt: dateFilter
        }
      });
    }

    // Execute count pipeline
    let countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await BloodBag.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Execute pagination
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    );

    const bloodBags = await BloodBag.aggregate(pipeline);

    if (!bloodBags || bloodBags.length === 0) {
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

    const tableData = bloodBags.map(bag => {
      const rbc = bag.populatedComponents.find(c => c.componentType === "RBC");
      const ffp = bag.populatedComponents.find(c => c.componentType === "FFP");
      const platelet = bag.populatedComponents.find(c => c.componentType === "Platelet");
      const cryo = bag.populatedComponents.find(c => c.componentType === "Cryo");

      return {
        id: bag._id,
        bagNo: bag.bagNo,
        bloodGroup: `${bag.bloodGroup} ${bag.rh}`,
        site: bag.siteData ? bag.siteData.name : "-",
        createdAt: bag.createdAt,
        rbc: rbc ? {
          id: rbc._id,
          componentId: rbc.componentId,
          volumeMl: rbc.volumeMl,
          status: "prepared",
          componentStatus: rbc.status,
          expiryDate: rbc.expiryDate
        } : { status: "unprepared" },
        ffp: ffp ? {
          id: ffp._id,
          componentId: ffp.componentId,
          volumeMl: ffp.volumeMl,
          status: "prepared",
          componentStatus: ffp.status,
          expiryDate: ffp.expiryDate
        } : { status: "unprepared" },
        platelet: platelet ? {
          id: platelet._id,
          componentId: platelet.componentId,
          volumeMl: platelet.volumeMl,
          status: "prepared",
          componentStatus: platelet.status,
          expiryDate: platelet.expiryDate
        } : { status: "unprepared" },
        cryo: cryo ? {
          id: cryo._id,
          componentId: cryo.componentId,
          volumeMl: cryo.volumeMl,
          status: "prepared",
          componentStatus: cryo.status,
          expiryDate: cryo.expiryDate
        } : { status: "unprepared" },
      };
    });

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
      return res.status(400).json({ message: "Invalid ID." });
    }

    // 1. Try to find a component
    let component = await Component.findById(id)
      .populate({
        path: "donationId",
        populate: [
          {
            path: "donor",
            select: "name.firstName name.middleName name.lastName dob sex phone",
            model: "Donor"
          },
          {
            path: "separationVerifiedBy",
            select: "name.first name.last email",
            model: "User"
          }
        ],
        select: "bagNo bloodGroup rh collectionDate status siteId separationVerifiedBy separationVerifiedSignature separationVerifiedAt"
      })
      .populate("siteId")
      .populate("createdBy")
      .populate("updatedBy");

    if (component) {
      // It's a single component
      const bloodBag = component.donationId;
      if (bloodBag) {
        const siblingComponents = await Component.find({ donationId: bloodBag._id });

        const rbc = siblingComponents.find(c => c.componentType === "RBC");
        const ffp = siblingComponents.find(c => c.componentType === "FFP");
        const platelet = siblingComponents.find(c => c.componentType === "Platelet");
        const cryo = siblingComponents.find(c => c.componentType === "Cryo");

        return res.status(200).json({
          message: "Component details fetched successfully.",
          component: {
            isBloodBagGroup: true,
            bloodBag: {
              id: bloodBag._id,
              bagNo: bloodBag.bagNo,
              bloodGroup: `${bloodBag.bloodGroup} ${bloodBag.rh}`,
              collectionDate: bloodBag.collectionDate,
              status: bloodBag.status,
              site: component.siteId || null,
              donor: bloodBag.donor || null,
              separationVerifiedBy: bloodBag.separationVerifiedBy || null,
              separationVerifiedSignature: bloodBag.separationVerifiedSignature || null,
              separationVerifiedAt: bloodBag.separationVerifiedAt || null,
            },
            rbc: rbc ? {
              id: rbc._id,
              componentId: rbc.componentId,
              volumeMl: rbc.volumeMl,
              status: rbc.status,
              expiryDate: rbc.expiryDate,
              lotNo: rbc.lotNo,
              storageLocation: rbc.storageLocation,
              createdAt: rbc.createdAt,
            } : { status: "unprepared" },
            ffp: ffp ? {
              id: ffp._id,
              componentId: ffp.componentId,
              volumeMl: ffp.volumeMl,
              status: ffp.status,
              expiryDate: ffp.expiryDate,
              lotNo: ffp.lotNo,
              storageLocation: ffp.storageLocation,
              createdAt: ffp.createdAt,
            } : { status: "unprepared" },
            platelet: platelet ? {
              id: platelet._id,
              componentId: platelet.componentId,
              volumeMl: platelet.volumeMl,
              status: platelet.status,
              expiryDate: platelet.expiryDate,
              lotNo: platelet.lotNo,
              storageLocation: platelet.storageLocation,
              createdAt: platelet.createdAt,
            } : { status: "unprepared" },
            cryo: cryo ? {
              id: cryo._id,
              componentId: cryo.componentId,
              volumeMl: cryo.volumeMl,
              status: cryo.status,
              expiryDate: cryo.expiryDate,
              lotNo: cryo.lotNo,
              storageLocation: cryo.storageLocation,
              createdAt: cryo.createdAt,
            } : { status: "unprepared" },
          }
        });
      }
    }

    // 2. Try to find a BloodBag
    const bloodBag = await BloodBag.findById(id)
      .populate({
        path: "donor",
        select: "name.firstName name.middleName name.lastName dob sex phone",
        model: "Donor"
      })
      .populate({
        path: "separationVerifiedBy",
        select: "name.first name.last email",
        model: "User"
      })
      .populate("siteId")
      .populate("components");

    if (!bloodBag) {
      return res.status(404).json({ message: "Details not found." });
    }

    // Find all components for this blood bag
    const siblingComponents = await Component.find({ donationId: bloodBag._id });

    const rbc = siblingComponents.find(c => c.componentType === "RBC");
    const ffp = siblingComponents.find(c => c.componentType === "FFP");
    const platelet = siblingComponents.find(c => c.componentType === "Platelet");
    const cryo = siblingComponents.find(c => c.componentType === "Cryo");

    return res.status(200).json({
      message: "Blood bag component details fetched successfully.",
      component: {
        isBloodBagGroup: true,
        bloodBag: {
          id: bloodBag._id,
          bagNo: bloodBag.bagNo,
          bloodGroup: `${bloodBag.bloodGroup} ${bloodBag.rh}`,
          collectionDate: bloodBag.collectionDate,
          status: bloodBag.status,
          site: bloodBag.siteId || null,
          donor: bloodBag.donor || null,
          separationVerifiedBy: bloodBag.separationVerifiedBy || null,
          separationVerifiedSignature: bloodBag.separationVerifiedSignature || null,
          separationVerifiedAt: bloodBag.separationVerifiedAt || null,
        },
        rbc: rbc ? {
          id: rbc._id,
          componentId: rbc.componentId,
          volumeMl: rbc.volumeMl,
          status: rbc.status,
          expiryDate: rbc.expiryDate,
          lotNo: rbc.lotNo,
          storageLocation: rbc.storageLocation,
          createdAt: rbc.createdAt,
        } : { status: "unprepared" },
        ffp: ffp ? {
          id: ffp._id,
          componentId: ffp.componentId,
          volumeMl: ffp.volumeMl,
          status: ffp.status,
          expiryDate: ffp.expiryDate,
          lotNo: ffp.lotNo,
          storageLocation: ffp.storageLocation,
          createdAt: ffp.createdAt,
        } : { status: "unprepared" },
        platelet: platelet ? {
          id: platelet._id,
          componentId: platelet.componentId,
          volumeMl: platelet.volumeMl,
          status: platelet.status,
          expiryDate: platelet.expiryDate,
          lotNo: platelet.lotNo,
          storageLocation: platelet.storageLocation,
          createdAt: platelet.createdAt,
        } : { status: "unprepared" },
        cryo: cryo ? {
          id: cryo._id,
          componentId: cryo.componentId,
          volumeMl: cryo.volumeMl,
          status: cryo.status,
          expiryDate: cryo.expiryDate,
          lotNo: cryo.lotNo,
          storageLocation: cryo.storageLocation,
          createdAt: cryo.createdAt,
        } : { status: "unprepared" },
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

