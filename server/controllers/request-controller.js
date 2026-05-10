/*
POST   /requests                    – Create hospital request
GET    /requests                    – List requests (filter by status, hospital, date)
GET    /requests/:id                – Get request details
GET    /requests/compatibility-info – Get compatibility rules for a component
POST   /requests/:id/match          – Match available inventory (compatibility-aware FIFO)
PATCH  /requests/:id/approve        – Approve matched request
PATCH  /requests/:id/issue          – Issue reserved units
PATCH  /requests/:id/complete       – Complete request
PATCH  /requests/:id/reject         – Reject request
PATCH  /requests/:id/crossmatch     – Update crossmatch status for a matched unit
*/

const HospitalRequest = require('../models/hospital-request-model');
const Hospital = require('../models/hospital-model');
const Inventory = require('../models/inventory-model');
const Component = require('../models/component-model');
const { withOptionalTransaction } = require('../utils/with-optional-transaction');
const compatibility = require('../utils/blood-compatibility');

function toInt(v, d) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : d;
}

async function createRequest(req, res, next) {
  try {
    const { hospitalId, patient, requestedComponents, doctorName, requiredAt, medicalOfficerSignature, hospitalSeal } = req.body;
    if (!hospitalId || !patient || !Array.isArray(requestedComponents) || requestedComponents.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid payload' });
    }
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }
    for (const rc of requestedComponents) {
      if (!rc?.componentType || !rc?.units || !rc?.bloodGroup || !rc?.rh || !rc?.urgency) {
        return res.status(400).json({ success: false, message: 'Invalid requested component' });
      }
    }
    const reqId = `REQ-${Date.now()}`;
    const created = await HospitalRequest.create({
      requestId: reqId,
      hospitalId,
      doctorName,
      requiredAt: requiredAt ? new Date(requiredAt) : undefined,
      medicalOfficerSignature,
      hospitalSeal,
      patient,
      requestedComponents,
      status: 'pending',
      requestedAt: new Date(),
    });
    return res.status(201).json({ success: true, message: 'Request created', data: created });
  } catch (err) { next(err); }
}

async function listRequests(req, res, next) {
  try {
    const page = toInt(req.query.page, 1);
    const limit = toInt(req.query.limit, 10);
    const skip = (page - 1) * limit;
    const { status, hospitalId, from, to, sortBy = 'updatedAt', order = 'desc', search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (hospitalId) filter.hospitalId = hospitalId;
    if (from || to) {
      filter.requestedAt = {};
      if (from) filter.requestedAt.$gte = new Date(from);
      if (to) filter.requestedAt.$lte = new Date(to);
    }
    if (search) {
      filter.$or = [
        { requestId: { $regex: search, $options: 'i' } },
        { 'patient.name': { $regex: search, $options: 'i' } },
      ];
    }
    const sort = { [sortBy]: order === 'asc' ? 1 : -1 };
    const [items, total] = await Promise.all([
      HospitalRequest.find(filter)
        .populate('hospitalId')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      HospitalRequest.countDocuments(filter)
    ]);
    return res.status(200).json({ success: true, data: items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
}

async function getRequestById(req, res, next) {
  try {
    const { id } = req.params;
    const doc = await HospitalRequest.findById(id)
      .populate('hospitalId')
      .populate({
        path: 'matchedInventory.inventoryId',
        populate: [{ path: 'componentId', model: 'Component' }, { path: 'bagNo', model: 'BloodBag' }]
      });
    if (!doc) return res.status(404).json({ success: false, message: 'Request not found' });
    return res.status(200).json({ success: true, data: doc });
  } catch (err) { next(err); }
}

async function matchRequest(req, res, next) {
  try {
    return await withOptionalTransaction(async (session) => {
      const { id } = req.params;
      const now = new Date();
      const request = session
        ? await HospitalRequest.findById(id).session(session)
        : await HospitalRequest.findById(id);

      if (!request) {
        return res.status(404).json({ success: false, message: 'Request not found' });
      }
      if (request.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'Only pending requests can be matched' });
      }

      const selections = [];
      const shortages = [];

      for (const rc of request.requestedComponents) {
        // ── Get compatible donor groups using the compatibility engine ──
        const compatibleGroups = compatibility.getCompatibleDonorGroups(rc.bloodGroup, rc.componentType);
        const preferredGroups = compatibility.getPreferredDonorGroups(rc.bloodGroup, rc.componentType);
        const xmRequired = compatibility.requiresCrossmatch(rc.componentType);

        if (!compatibleGroups.length) {
          shortages.push({
            componentType: rc.componentType,
            bloodGroup: rc.bloodGroup,
            rh: rc.rh,
            required: rc.units,
            available: 0,
            reason: 'No compatible donor groups found',
          });
          continue;
        }

        // ── Build Rh filter based on component rules ──
        let rhFilter;
        if (['RBC', 'WB', 'LR-PCV'].includes(rc.componentType)) {
          // Strict Rh: Rh− recipient → only Rh−; Rh+ → both
          if (rc.rh === 'Negative') {
            rhFilter = { 'bag.rh': 'Negative' };
          } else {
            // Rh+ can receive both, but prefer Rh+ first (handled in sort)
            rhFilter = { 'bag.rh': { $in: ['Positive', 'Negative'] } };
          }
        } else {
          // FFP, Cryo: Rh ignored; Platelet: Rh optional (accept both)
          rhFilter = { 'bag.rh': { $in: ['Positive', 'Negative'] } };
        }

        // ── Aggregation pipeline: compatibility-aware FIFO ──
        const pipeline = [
          { $match: { status: 'in-stock' } },

          // Join component
          { $lookup: { from: 'components', localField: 'componentId', foreignField: '_id', as: 'component' } },
          { $unwind: '$component' },

          // Join blood bag
          { $lookup: { from: 'bloodbags', localField: 'bagNo', foreignField: '_id', as: 'bag' } },
          { $unwind: '$bag' },

          // Filter: component type + ABO compatibility + Rh compatibility + not expired
          {
            $match: {
              'component.componentType': rc.componentType,
              'bag.bloodGroup': { $in: compatibleGroups },
              ...rhFilter,
              'component.expiryDate': { $gte: now },
            },
          },

          // Add sort-priority fields:
          //   matchPriority: 0 = exact ABO+Rh, 1 = exact ABO only, 2 = compatible
          // This ensures exact matches are consumed first (preserving universal donors)
          {
            $addFields: {
              _aboExact: { $cond: [{ $eq: ['$bag.bloodGroup', rc.bloodGroup] }, true, false] },
              _rhExact: { $cond: [{ $eq: ['$bag.rh', rc.rh] }, true, false] },
              _matchPriority: {
                $switch: {
                  branches: [
                    {
                      case: {
                        $and: [
                          { $eq: ['$bag.bloodGroup', rc.bloodGroup] },
                          { $eq: ['$bag.rh', rc.rh] },
                        ],
                      },
                      then: 0, // Exact ABO + Rh
                    },
                    {
                      case: { $eq: ['$bag.bloodGroup', rc.bloodGroup] },
                      then: 1, // Exact ABO, different Rh
                    },
                  ],
                  default: 2, // Compatible but not exact
                },
              },
            },
          },

          // Sort: exact match first → then FIFO (oldest in-stock first) → nearest expiry
          { $sort: { _matchPriority: 1, inStockDate: 1, 'component.expiryDate': 1 } },

          { $limit: rc.units },

          {
            $project: {
              _id: 1,
              _aboExact: 1,
              _rhExact: 1,
              'bag.bloodGroup': 1,
              'bag.rh': 1,
            },
          },
        ];

        const docs = session
          ? await Inventory.aggregate(pipeline).session(session)
          : await Inventory.aggregate(pipeline);

        if (docs.length < rc.units) {
          shortages.push({
            componentType: rc.componentType,
            bloodGroup: rc.bloodGroup,
            rh: rc.rh,
            required: rc.units,
            available: docs.length,
            compatibleGroupsSearched: compatibleGroups,
          });
        }

        // Build selection entries with compatibility metadata
        for (const doc of docs) {
          const isExact = doc._aboExact && doc._rhExact;
          selections.push({
            id: doc._id,
            reservedAt: now,
            compatibilityType: isExact ? 'exact' : 'compatible',
            crossmatchRequired: xmRequired,
            crossmatchStatus: xmRequired ? 'pending' : 'not-required',
          });
        }
      }

      if (shortages.length) {
        return res.status(409).json({
          success: false,
          message: 'Insufficient compatible stock to fully match request',
          data: { shortages },
        });
      }

      // ── Reserve inventory ──
      const invIds = selections.map(s => s.id);
      const upd = await Inventory.updateMany(
        { _id: { $in: invIds }, status: 'in-stock' },
        { $set: { status: 'reserved', reservedFor: request._id, reservedAt: now } },
        session ? { session } : {}
      );

      if (upd.modifiedCount !== invIds.length) {
        // Concurrent update — rollback if no session
        if (!session) {
          await Inventory.updateMany(
            { _id: { $in: invIds }, status: 'reserved', reservedFor: request._id, reservedAt: now },
            { $set: { status: 'in-stock', reservedFor: null, reservedAt: null } }
          );
        }
        return res.status(409).json({ success: false, message: 'Concurrent update detected while reserving stock' });
      }

      // ── Save matched inventory with compatibility metadata ──
      const matched = selections.map(s => ({
        inventoryId: s.id,
        reservedAt: s.reservedAt,
        compatibilityType: s.compatibilityType,
        crossmatchRequired: s.crossmatchRequired,
        crossmatchStatus: s.crossmatchStatus,
      }));
      request.matchedInventory.push(...matched);
      request.status = 'matched';
      if (session) {
        await request.save({ session });
      } else {
        await request.save();
      }

      return res.status(200).json({
        success: true,
        message: 'Request matched and inventory reserved (compatibility-aware FIFO)',
        data: { matchedCount: matched.length, inventoryIds: invIds },
      });
    });
  } catch (err) {
    next(err);
  }
}

async function approveRequest(req, res, next) {
  try {
    const { id } = req.params;
    const request = await HospitalRequest.findById(id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status !== 'matched') return res.status(400).json({ success: false, message: 'Only matched requests can be approved' });
    request.status = 'approved';
    request.approvedAt = new Date();
    request.approvedBy = req.userID || null;
    await request.save();
    return res.status(200).json({ success: true, message: 'Request approved', data: request });
  } catch (err) { next(err); }
}

async function issueRequest(req, res, next) {
  try {
    return await withOptionalTransaction(async (session) => {
      const { id } = req.params;
      const now = new Date();
      const request = session
        ? await HospitalRequest.findById(id).session(session)
        : await HospitalRequest.findById(id);

      if (!request) {
        return res.status(404).json({ success: false, message: 'Request not found' });
      }
      if (!['approved', 'matched'].includes(request.status)) {
        return res.status(400).json({ success: false, message: 'Only approved or matched requests can be issued' });
      }

      // ── Server-side crossmatch safety check ──
      const pendingXM = (request.matchedInventory || []).filter(
        (mi) => mi.crossmatchRequired && mi.crossmatchStatus === 'pending'
      );
      const incompatXM = (request.matchedInventory || []).filter(
        (mi) => mi.crossmatchRequired && mi.crossmatchStatus === 'incompatible'
      );
      if (pendingXM.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot issue: ${pendingXM.length} RBC unit(s) have pending crossmatch`,
        });
      }
      if (incompatXM.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot issue: ${incompatXM.length} RBC unit(s) have incompatible crossmatch`,
        });
      }

      const reservedAgg = Inventory.aggregate([
        { $match: { status: 'reserved', reservedFor: request._id } },
        { $lookup: { from: 'components', localField: 'componentId', foreignField: '_id', as: 'component' } },
        { $unwind: '$component' },
        { $match: { 'component.expiryDate': { $gte: now } } },
        { $project: { _id: 1 } }
      ]);

      const reserved = session ? await reservedAgg.session(session) : await reservedAgg;
      const invIds = reserved.map(r => r._id);
      if (invIds.length === 0) {
        return res.status(400).json({ success: false, message: 'No eligible reserved units to issue' });
      }

      const upd = await Inventory.updateMany(
        { _id: { $in: invIds }, status: 'reserved', reservedFor: request._id },
        { $set: { status: 'issued', issuedAt: now, issuedBy: req.userID || null } },
        session ? { session } : {}
      );

      if (upd.modifiedCount === 0) {
        return res.status(409).json({ success: false, message: 'Concurrent update detected while issuing' });
      }

      // Sync Component status to 'issued' for traceability
      const affectedInv = session
        ? await Inventory.find({ _id: { $in: invIds } }, { componentId: 1 }).session(session)
        : await Inventory.find({ _id: { $in: invIds } }, { componentId: 1 });
      const compIds = affectedInv.map(d => d.componentId).filter(Boolean);
      if (compIds.length) {
        await Component.updateMany(
          { _id: { $in: compIds } },
          { $set: { status: 'issued' } },
          session ? { session } : {}
        );
      }

      request.status = 'issued';
      request.issuedAt = now;
      request.issuedBy = req.userID || null;
      if (session) {
        await request.save({ session });
      } else {
        await request.save();
      }

      return res.status(200).json({ success: true, message: 'Units issued', data: { issuedCount: upd.modifiedCount, inventoryIds: invIds } });
    });
  } catch (err) {
    next(err);
  }
}

async function completeRequest(req, res, next) {
  try {
    const { id } = req.params;
    const request = await HospitalRequest.findById(id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status !== 'issued') return res.status(400).json({ success: false, message: 'Only issued requests can be completed' });
    const outstanding = await Inventory.countDocuments({ reservedFor: request._id, status: 'reserved' });
    if (outstanding > 0) return res.status(400).json({ success: false, message: 'Some units are still reserved' });
    request.status = 'completed';
    request.completedAt = new Date();
    await request.save();
    return res.status(200).json({ success: true, message: 'Request completed', data: request });
  } catch (err) { next(err); }
}

async function rejectRequest(req, res, next) {
  try {
    return await withOptionalTransaction(async (session) => {
      const { id } = req.params;
      const request = session
        ? await HospitalRequest.findById(id).session(session)
        : await HospitalRequest.findById(id);

      if (!request) {
        return res.status(404).json({ success: false, message: 'Request not found' });
      }
      if (!['pending', 'matched', 'approved'].includes(request.status)) {
        return res.status(400).json({ success: false, message: 'Only pending, matched, or approved requests can be rejected' });
      }

      await Inventory.updateMany(
        { reservedFor: request._id, status: 'reserved' },
        { $set: { status: 'in-stock', reservedFor: null, reservedAt: null } },
        session ? { session } : {}
      );
      request.status = 'rejected';
      if (session) {
        await request.save({ session });
      } else {
        await request.save();
      }

      return res.status(200).json({ success: true, message: 'Request rejected' });
    });
  } catch (err) {
    next(err);
  }
}

// ──────────────────────────────────────────────
// CROSSMATCH UPDATE
// ──────────────────────────────────────────────

async function updateCrossmatch(req, res, next) {
  try {
    return await withOptionalTransaction(async (session) => {
      const { id } = req.params;
      const { inventoryId, crossmatchStatus } = req.body;

      console.log(`[crossmatch] PATCH /requests/${id}/crossmatch body:`, { inventoryId, crossmatchStatus });

      if (!inventoryId || !['compatible', 'incompatible'].includes(crossmatchStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Provide inventoryId and crossmatchStatus (compatible | incompatible)',
        });
      }

      const request = session
        ? await HospitalRequest.findById(id).session(session)
        : await HospitalRequest.findById(id);

      if (!request) {
        console.log(`[crossmatch] Request not found for id: ${id}`);
        return res.status(404).json({ success: false, message: 'Request not found' });
      }
      if (!['matched', 'approved'].includes(request.status)) {
        return res.status(400).json({
          success: false,
          message: 'Crossmatch can only be updated for matched or approved requests',
        });
      }

      // Find the matched inventory entry
      const miEntry = request.matchedInventory.find(
        (mi) => mi.inventoryId.toString() === inventoryId.toString()
      );
      if (!miEntry) {
        return res.status(404).json({
          success: false,
          message: 'Inventory item not found in this request\'s matched inventory',
        });
      }
      if (!miEntry.crossmatchRequired) {
        return res.status(400).json({
          success: false,
          message: 'Crossmatch is not required for this component type',
        });
      }

      miEntry.crossmatchStatus = crossmatchStatus;

      // If incompatible → release the unit and try to find a replacement
      if (crossmatchStatus === 'incompatible') {
        const now = new Date();

        // Release the incompatible unit
        await Inventory.updateOne(
          { _id: miEntry.inventoryId },
          { $set: { status: 'in-stock', reservedFor: null, reservedAt: null } },
          session ? { session } : {}
        );

        // Remove from matchedInventory
        request.matchedInventory = request.matchedInventory.filter(
          (mi) => mi.inventoryId.toString() !== inventoryId.toString()
        );

        // Try to find a replacement using the same component's request info
        // We need to know the original requested component to apply correct compatibility rules
        // Lookup the inventory to get component type and blood bag info
        const releasedInv = session
          ? await Inventory.findById(inventoryId).populate('componentId').populate('bagNo').session(session)
          : await Inventory.findById(inventoryId).populate('componentId').populate('bagNo');

        if (releasedInv && releasedInv.componentId) {
          const compType = releasedInv.componentId.componentType;

          // Find the original requested component to get recipient blood group/Rh
          const originalRC = request.requestedComponents.find(
            (rc) => rc.componentType === compType
          );

          if (originalRC) {
            const compatibleGroups = compatibility.getCompatibleDonorGroups(
              originalRC.bloodGroup,
              compType
            );

            let rhFilter;
            if (['RBC', 'WB', 'LR-PCV'].includes(compType) && originalRC.rh === 'Negative') {
              rhFilter = { 'bag.rh': 'Negative' };
            } else {
              rhFilter = { 'bag.rh': { $in: ['Positive', 'Negative'] } };
            }

            // Exclude already-matched inventory IDs
            const alreadyMatchedIds = request.matchedInventory.map(
              (mi) => mi.inventoryId
            );

            const replacementPipeline = [
              {
                $match: {
                  status: 'in-stock',
                  _id: { $nin: alreadyMatchedIds },
                },
              },
              { $lookup: { from: 'components', localField: 'componentId', foreignField: '_id', as: 'component' } },
              { $unwind: '$component' },
              { $lookup: { from: 'bloodbags', localField: 'bagNo', foreignField: '_id', as: 'bag' } },
              { $unwind: '$bag' },
              {
                $match: {
                  'component.componentType': compType,
                  'bag.bloodGroup': { $in: compatibleGroups },
                  ...rhFilter,
                  'component.expiryDate': { $gte: now },
                },
              },
              {
                $addFields: {
                  _matchPriority: {
                    $cond: [
                      {
                        $and: [
                          { $eq: ['$bag.bloodGroup', originalRC.bloodGroup] },
                          { $eq: ['$bag.rh', originalRC.rh] },
                        ],
                      },
                      0,
                      1,
                    ],
                  },
                },
              },
              { $sort: { _matchPriority: 1, inStockDate: 1, 'component.expiryDate': 1 } },
              { $limit: 1 },
              { $project: { _id: 1, 'bag.bloodGroup': 1, 'bag.rh': 1 } },
            ];

            const replacements = session
              ? await Inventory.aggregate(replacementPipeline).session(session)
              : await Inventory.aggregate(replacementPipeline);

            if (replacements.length > 0) {
              const rep = replacements[0];
              const isExact =
                rep.bag.bloodGroup === originalRC.bloodGroup &&
                rep.bag.rh === originalRC.rh;

              // Reserve the replacement
              const repUpd = await Inventory.updateOne(
                { _id: rep._id, status: 'in-stock' },
                { $set: { status: 'reserved', reservedFor: request._id, reservedAt: now } },
                session ? { session } : {}
              );

              if (repUpd.modifiedCount === 1) {
                request.matchedInventory.push({
                  inventoryId: rep._id,
                  reservedAt: now,
                  compatibilityType: isExact ? 'exact' : 'compatible',
                  crossmatchRequired: true,
                  crossmatchStatus: 'pending',
                });
              }
            }
          }
        }
      }

      if (session) {
        await request.save({ session });
      } else {
        await request.save();
      }

      return res.status(200).json({
        success: true,
        message: crossmatchStatus === 'compatible'
          ? 'Crossmatch marked as compatible'
          : 'Crossmatch incompatible — unit released, replacement attempted',
        data: request,
      });
    });
  } catch (err) {
    next(err);
  }
}

// ──────────────────────────────────────────────
// COMPATIBILITY INFO (read-only, no DB)
// ──────────────────────────────────────────────

async function getCompatibilityInfo(req, res, next) {
  try {
    const { componentType, bloodGroup, rh } = req.query;
    if (!componentType) {
      return res.status(400).json({
        success: false,
        message: 'componentType query param is required',
      });
    }
    const info = compatibility.getFullCompatibilityInfo(
      componentType,
      bloodGroup || null,
      rh || null
    );
    return res.status(200).json({ success: true, data: info });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createRequest,
  createHospitalRequest: createRequest,
  listRequests,
  getRequestById,
  matchRequest,
  matchRequisitionFIFO: matchRequest,
  approveRequest,
  issueRequest,
  issueBloodUnits: issueRequest,
  completeRequest,
  completeHospitalRequest: completeRequest,
  rejectRequest,
  updateCrossmatch,
  getCompatibilityInfo,
};