const DiscardLog = require("../models/discard-model");
const BloodBag = require("../models/bloodbag-model");
const Component = require("../models/component-model");
const Inventory = require("../models/inventory-model");

const mongoose = require("mongoose");
const { withOptionalTransaction } = require("../utils/with-optional-transaction");

// ============================================================
// 🧾 GET ALL DISCARDED ITEMS (with Bag + Component + Donor info)
// ============================================================
const getList = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filters
    const filter = {};
    if (req.query.itemType) filter.itemType = req.query.itemType;
    if (req.query.siteId) filter.siteId = req.query.siteId;
    if (req.query.isAutoDiscarded !== undefined)
      filter.isAutoDiscarded = req.query.isAutoDiscarded === "true";

    // Sorting
    const sortBy = req.query.sortBy || "discardedAt";
    const order = req.query.order === "asc" ? 1 : -1;
    const sort = { [sortBy]: order };

    // Query DB
    const [total, logs, totalFiltered] = await Promise.all([
      DiscardLog.countDocuments({}),
      DiscardLog.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate({
          path: "bagNo",
          populate: [
            { path: "donor", model: "Donor" },
            { path: "components", model: "Component" },
          ],
        })
        .populate("componentId") // For component-level discard
        .populate("siteId", "name"),
      DiscardLog.countDocuments(filter),
    ]);

    // Format Response
    const formattedLogs = logs.map((log) => {
      const bag = log.bagNo || {};
      const donor = bag.donor || {};
      const component = log.componentId || null;

      // 🧪 FIXED — TEST RESULTS ARE FROM BAG, NOT COMPONENT
      const testResults = bag?.testResults?.length
        ? bag.testResults.map((t) => `${t.test}: ${t.result}`).join(", ")
        : "N/A";

      return {
        id: log._id.toString(),
        itemType: log.itemType,
        isAutoDiscarded: log.isAutoDiscarded,
        reason: log.reason || "N/A",
        discardedAt: log.discardedAt?.toISOString().split("T")[0] || "N/A",
        createdAt: log.createdAt?.toISOString() || "N/A",

        // ID (either component or bag)
        itemId: component?._id || bag._id || null,

        // 🧍 Donor Info
        donorId: donor.uid || "N/A",
        firstName: donor.name?.firstName || "N/A",
        middleName: donor.name?.middleName || "",
        lastName: donor.name?.lastName || "N/A",
        dob: donor.dob ? donor.dob.toISOString().split("T")[0] : "N/A",
        sex: donor.sex || "N/A",
        phone: donor.phone || "N/A",
        email: donor.email || "N/A",
        bloodGroup: donor.bloodGroup || "N/A",
        rh: donor.rh || "N/A",

        // 💉 Bag Info
        bagNo: bag.bagNo || "N/A",
        segmentId: bag.segmentNo || "N/A",
        collectionDate: bag.collectionDate
          ? bag.collectionDate.toISOString().split("T")[0]
          : "N/A",
        expiryDate: bag.expiryDate
          ? bag.expiryDate.toISOString().split("T")[0]
          : "N/A",
        initialVitals: bag.initialVitals || {
          hb: "N/A",
          weightKg: "N/A",
          pulse: "N/A",
          tempC: "N/A",
          bp: "N/A",
        },
        status: bag.status || "N/A",

        // 🧫 Component Info (only when component discarded)
        componentId: component?.componentId || null,
        componentType: component?.componentType || null,

        // 🧪 FIXED — BAG LEVEL TEST RESULTS
        testResults,

        siteId: log.siteId?.name || "N/A",
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedLogs,
      pagination: {
        total,
        totalFiltered,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching discard logs:", error);
    next(error);
  }
};



// ============================================================
// 🧾 GET SINGLE DISCARDED ITEM DETAILS (Final Updated Version)
// ============================================================
const getSingleDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid discard log ID format",
      });
    }

    const log = await DiscardLog.findById(id)
      .populate({
        path: "bagNo",
        populate: [
          { path: "donor", model: "Donor" },
          { path: "components", model: "Component" },
        ],
      })
      .populate("componentId") // include component only if discarded individually
      .populate("siteId", "name");

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Discard log not found",
      });
    }

    const bag = log.bagNo || {};
    const donor = bag.donor || {};
    const component = log.componentId || null;

    // 🧪 FIXED — TEST RESULTS MUST COME FROM BAG
    const bagTestResults = bag.testResults?.length
      ? bag.testResults.map((t) => ({
        test: t.test,
        result: t.result,
        testedAt: t.testedAt,
      }))
      : [];

    // 🧫 Component test results removed (as per new model)
    const componentTestResults = [];

    const formatted = {
      id: log._id.toString(),
      itemType: log.itemType,
      isAutoDiscarded: log.isAutoDiscarded,
      reason: log.reason || "N/A",

      discardedAt: log.discardedAt || null,
      createdAt: log.createdAt || null,

      // 🏥 Site Info
      site: log.siteId
        ? {
          id: log.siteId._id,
          name: log.siteId.name,
        }
        : null,

      // 💉 Bag Info
      bag: bag
        ? {
          id: bag._id,
          bagNo: bag.bagNo,
          segmentId: bag.segmentNo,
          collectionDate: bag.collectionDate,
          expiryDate: bag.expiryDate,
          status: bag.status,
          initialVitals: bag.initialVitals,
          bloodGroup: bag.bloodGroup,
          rh: bag.rh,
          testResults: bagTestResults, // ✅ Correct source
        }
        : null,

      // 🧫 Component Info (only if a component was discarded)
      component: component
        ? {
          id: component._id,
          componentId: component.componentId,
          componentType: component.componentType,
          status: component.status,
          testResults: componentTestResults, // always empty now
        }
        : null,

      // 🧍 Donor Info
      donor: donor
        ? {
          id: donor._id,
          donorId: donor.donorId,
          uid: donor.uid,
          name: donor.name,
          dob: donor.dob,
          sex: donor.sex,
          phone: donor.phone,
          email: donor.email,
          bloodGroup: donor.bloodGroup,
          rh: donor.rh,
        }
        : null,
    };

    return res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("Error fetching discard log:", error);
    next(error);
  }
};


// Discard Model (Manual)
const discardItem = async (req, res, next) => {
  try {
    return await withOptionalTransaction(async (session) => {
      const { itemType, bagNo, reason, updatedBy, siteId } = req.body;

      if (!itemType || !bagNo || !updatedBy) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: itemType, bagNo, updatedBy",
        });
      }

      let discardedDoc = null;

      // ======================================
      // 🧬 CASE 1: DISCARD COMPONENT
      // ======================================
      if (itemType === "Component") {
        const component = session
          ? await Component.findById(bagNo).session(session)
          : await Component.findById(bagNo);
        if (!component) {
          return res.status(404).json({ success: false, message: "Component not found" });
        }

        // Discard component
        component.status = "discarded";
        component.updatedBy = updatedBy;
        if (session) {
          await component.save({ session });
        } else {
          await component.save();
        }

        // Update Inventory (if found)
        await Inventory.updateOne(
          { componentId: component._id },
          { $set: { status: "discarded" } },
          session ? { session } : {}
        );

        // Create discard log
        const discardLog = new DiscardLog({
          itemType: "Component",
          bagNo: component.donationId,
          componentId: component._id,
          reason: reason || "Manually discarded component",
          discardedAt: new Date(),
          siteId,
          updatedBy,
          isAutoDiscarded: false,
        });
        if (session) {
          await discardLog.save({ session });
        } else {
          await discardLog.save();
        }

        discardedDoc = component;

        // Optional: If all components of the same bag are discarded, mark bag as discarded
        const remainingQuery = Component.countDocuments({
          bagId: component.bagId,
          status: { $ne: "discarded" },
        });
        const remainingActive = session ? await remainingQuery.session(session) : await remainingQuery;

        if (remainingActive === 0) {
          await BloodBag.findByIdAndUpdate(
            component.bagId,
            { status: "discarded", updatedBy },
            session ? { session } : {}
          );
        }
      }

      // ======================================
      // 🩸 CASE 2: DISCARD BAG
      // ======================================
      else if (itemType === "Bag") {
        const bagQuery = BloodBag.findById(bagNo)
          .populate("components");
        const bag = session ? await bagQuery.session(session) : await bagQuery;

        if (!bag) {
          return res.status(404).json({ success: false, message: "Blood Bag not found" });
        }

        // Find components with Positive test results
        const positiveQuery = Component.find({
          _id: { $in: bag.components },
          "testResults.result": "Positive",
        });
        const positiveComponents = session ? await positiveQuery.session(session) : await positiveQuery;

        if (positiveComponents.length === 0) {
          return res.status(400).json({
            success: false,
            message: "No component with positive test results — discard not required",
          });
        }

        // Discard all positive components
        const componentIds = positiveComponents.map((c) => c._id);
        await Component.updateMany(
          { _id: { $in: componentIds } },
          { $set: { status: "discarded", updatedBy } },
          session ? { session } : {}
        );

        // Update inventory for those components
        await Inventory.updateMany(
          { componentId: { $in: componentIds } },
          { $set: { status: "discarded" } },
          session ? { session } : {}
        );

        // If ALL components are positive/discarded → discard entire bag
        const totalComponents = bag.components.length;
        const discardedCountQuery = Component.countDocuments({
          _id: { $in: bag.components },
          status: "discarded",
        });
        const discardedCount = session ? await discardedCountQuery.session(session) : await discardedCountQuery;

        if (discardedCount === totalComponents) {
          bag.status = "discarded";
          bag.updatedBy = updatedBy;
          if (session) {
            await bag.save({ session });
          } else {
            await bag.save();
          }
        }

        // Log discard (for bag and components)
        await DiscardLog.create(
          [
            {
              itemType: "Bag",
              bagNo: bag._id,
              reason: reason || "Positive test result — bag discarded",
              discardedAt: new Date(),
              siteId,
              updatedBy,
              isAutoDiscarded: false,
            },
            ...componentIds.map((id) => ({
              itemType: "Component",
              bagNo: bag._id,
              componentId: id,
              reason: "Component tested positive — discarded with bag",
              discardedAt: new Date(),
              siteId,
              updatedBy,
              isAutoDiscarded: false,
            })),
          ],
          session ? { session } : {}
        );

        discardedDoc = bag;
      }

      // ======================================
      // ❌ INVALID TYPE
      // ======================================
      else {
        return res.status(400).json({
          success: false,
          message: "Invalid itemType. Must be 'Bag' or 'Component'.",
        });
      }

      return res.status(200).json({
        success: true,
        message: `${itemType} discarded successfully.`,
        discardedDoc,
      });
    });
  } catch (error) {
    console.log(`Error from discardItem: ${error}`);
    next(error);
  }
};

module.exports = {
  getList,
  getSingleDetails,
  discardItem
};
