/*
POST /requests – Create hospital request
GET /requests – List requests (filter by status, hospital, date)
GET /requests/:id – Get request details
POST /requests/:id/match – Match available inventory
PATCH /requests/:id/approve – Approve matched request
PATCH /requests/:id/reject – Reject request
*/

const HospitalRequest = require('../models/hospital-request-model');
const Hospital = require('../models/hospital-model');
const Inventory = require('../models/inventory-model');
const Component = require('../models/component-model');
const mongoose = require('mongoose');

function toInt(v, d) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : d;
}

async function createRequest(req, res, next) {
  try {
    const { hospitalId, patient, requestedComponents } = req.body;
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
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const now = new Date();
    const request = await HospitalRequest.findById(id).session(session);
    if (!request) {
      await session.abortTransaction(); session.endSession();
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    if (request.status !== 'pending') {
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({ success: false, message: 'Only pending requests can be matched' });
    }
    const selections = [];
    const shortages = [];
    for (const rc of request.requestedComponents) {
      const pipeline = [
        { $match: { status: 'in-stock' } },
        { $lookup: { from: 'components', localField: 'componentId', foreignField: '_id', as: 'component' } },
        { $unwind: '$component' },
        { $lookup: { from: 'bloodbags', localField: 'bagNo', foreignField: '_id', as: 'bag' } },
        { $unwind: '$bag' },
        { $match: { 'component.componentType': rc.componentType, 'bag.bloodGroup': rc.bloodGroup, 'bag.rh': rc.rh, 'component.expiryDate': { $gte: now } } },
        { $sort: { inStockDate: 1, 'component.expiryDate': 1 } },
        { $limit: rc.units },
        { $project: { _id: 1 } },
      ];
      const docs = await Inventory.aggregate(pipeline).session(session);
      const ids = docs.map(d => d._id);
      if (ids.length < rc.units) {
        shortages.push({ componentType: rc.componentType, required: rc.units, available: ids.length });
      }
      selections.push(...ids.map(i => ({ id: i, reservedAt: now })));
    }
    if (shortages.length) {
      await session.abortTransaction(); session.endSession();
      return res.status(409).json({ success: false, message: 'Insufficient stock to fully match request', data: { shortages } });
    }
    const invIds = selections.map(s => s.id);
    const upd = await Inventory.updateMany(
      { _id: { $in: invIds }, status: 'in-stock' },
      { $set: { status: 'reserved', reservedFor: request._id, reservedAt: now } },
      { session }
    );
    if (upd.modifiedCount !== invIds.length) {
      await session.abortTransaction(); session.endSession();
      return res.status(409).json({ success: false, message: 'Concurrent update detected while reserving stock' });
    }
    const matched = selections.map(s => ({ inventoryId: s.id, reservedAt: s.reservedAt }));
    request.matchedInventory.push(...matched);
    request.status = 'matched';
    await request.save({ session });
    await session.commitTransaction(); session.endSession();
    return res.status(200).json({ success: true, message: 'Request matched and inventory reserved', data: { matchedCount: matched.length, inventoryIds: invIds } });
  } catch (err) {
    await session.abortTransaction(); session.endSession();
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
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const now = new Date();
    const request = await HospitalRequest.findById(id).session(session);
    if (!request) {
      await session.abortTransaction(); session.endSession();
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    if (!['approved', 'matched'].includes(request.status)) {
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({ success: false, message: 'Only approved or matched requests can be issued' });
    }
    const reserved = await Inventory.aggregate([
      { $match: { status: 'reserved', reservedFor: request._id } },
      { $lookup: { from: 'components', localField: 'componentId', foreignField: '_id', as: 'component' } },
      { $unwind: '$component' },
      { $match: { 'component.expiryDate': { $gte: now } } },
      { $project: { _id: 1 } }
    ]).session(session);
    const invIds = reserved.map(r => r._id);
    if (invIds.length === 0) {
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({ success: false, message: 'No eligible reserved units to issue' });
    }
    const upd = await Inventory.updateMany(
      { _id: { $in: invIds }, status: 'reserved', reservedFor: request._id },
      { $set: { status: 'issued', issuedAt: now, issuedBy: req.userID || null } },
      { session }
    );
    if (upd.modifiedCount === 0) {
      await session.abortTransaction(); session.endSession();
      return res.status(409).json({ success: false, message: 'Concurrent update detected while issuing' });
    }
    // Sync Component status to 'issued' for traceability
    const affectedInv = await Inventory.find({ _id: { $in: invIds } }, { componentId: 1 }).session(session);
    const compIds = affectedInv.map(d => d.componentId).filter(Boolean);
    if (compIds.length) {
      await Component.updateMany({ _id: { $in: compIds } }, { $set: { status: 'issued' } }, { session });
    }
    request.status = 'issued';
    request.issuedAt = now;
    request.issuedBy = req.userID || null;
    await request.save({ session });
    await session.commitTransaction(); session.endSession();
    return res.status(200).json({ success: true, message: 'Units issued', data: { issuedCount: upd.modifiedCount, inventoryIds: invIds } });
  } catch (err) {
    await session.abortTransaction(); session.endSession();
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
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const request = await HospitalRequest.findById(id).session(session);
    if (!request) {
      await session.abortTransaction(); session.endSession();
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    if (!['pending', 'matched', 'approved'].includes(request.status)) {
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({ success: false, message: 'Only pending, matched, or approved requests can be rejected' });
    }
    await Inventory.updateMany(
      { reservedFor: request._id, status: 'reserved' },
      { $set: { status: 'in-stock', reservedFor: null, reservedAt: null } },
      { session }
    );
    request.status = 'rejected';
    await request.save({ session });
    await session.commitTransaction(); session.endSession();
    return res.status(200).json({ success: true, message: 'Request rejected' });
  } catch (err) {
    await session.abortTransaction(); session.endSession();
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
  rejectRequest
};