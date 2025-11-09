/*
GET /inventory – List in-stock components
GET /inventory/near-expiry – Get near-expiry items
POST /inventory/reserve – Reserve stock for request
POST /inventory/issue – Issue reserved stock
POST /inventory/discard – Discard expired/unusable stock
*/

const Inventory = require('../models/inventory-model');
const Component = require('../models/component-model');
const BloodBag = require('../models/bloodbag-model');
const HospitalRequest = require('../models/hospital-request-model');

// Helpers
const toInt = (v, d) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : d;
};

// GET /inventory – List in-stock components (with filters/pagination)
async function listInventory(req, res, next) {
  try {
    const page = toInt(req.query.page, 1);
    const limit = toInt(req.query.limit, 10);
    const skip = (page - 1) * limit;

    const {
      status = 'in-stock',
      componentType,
      siteId,
      search, // bagNo search
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const invFilter = {};
    if (status) invFilter.status = status;
    // search applied on bag.bagNo after lookup

    const compFilter = {};
    if (componentType) compFilter.componentType = componentType;
    if (siteId) compFilter.siteId = siteId;

    const allowedSort = {
      createdAt: 'createdAt',
      inStockDate: 'inStockDate',
      expiryDate: 'component.expiryDate',
      bagNo: 'bag.bagNo',
    };
    const sortField = allowedSort[sortBy] || 'createdAt';
    const sort = { [sortField]: order === 'asc' ? 1 : -1 };

    // Use aggregation to join Component and BloodBag
    const pipeline = [
      { $match: invFilter },
      { $lookup: { from: 'components', localField: 'componentId', foreignField: '_id', as: 'component' } },
      { $unwind: '$component' },
      { $lookup: { from: 'bloodbags', localField: 'bagNo', foreignField: '_id', as: 'bag' } },
      { $unwind: '$bag' },
      { $match: compFilter },
      ...(search ? [{ $match: { 'bag.bagNo': { $regex: search, $options: 'i' } } }] : []),
      {
        $project: {
          _id: 1,
          status: 1,
          inStockDate: 1,
          createdAt: 1,
          reservedFor: 1,
          componentId: 1,
          bagNo: 1,
          'component.componentType': 1,
          'component.volumeMl': 1,
          'component.expiryDate': 1,
          'component.siteId': 1,
          'bag.bagNo': 1,
          'bag.segmentNo': 1,
          'bag.bloodGroup': 1,
          'bag.rh': 1,
        },
      },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
    ];

    const [items, totalAgg] = await Promise.all([
      Inventory.aggregate(pipeline),
      Inventory.aggregate([
        { $match: invFilter },
        { $lookup: { from: 'components', localField: 'componentId', foreignField: '_id', as: 'component' } },
        { $unwind: '$component' },
        { $lookup: { from: 'bloodbags', localField: 'bagNo', foreignField: '_id', as: 'bag' } },
        { $unwind: '$bag' },
        { $match: compFilter },
        ...(search ? [{ $match: { 'bag.bagNo': { $regex: search, $options: 'i' } } }] : []),
        { $count: 'count' },
      ]),
    ]);

    const total = totalAgg?.[0]?.count || 0;

    return res.status(200).json({
      success: true,
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /inventory/near-expiry – Get near-expiry items
async function getNearExpiryInventory(req, res, next) {
  try {
    const page = toInt(req.query.page, 1);
    const limit = toInt(req.query.limit, 10);
    const skip = (page - 1) * limit;
    const { siteId, componentType, sortBy = 'expiryDate', order = 'asc' } = req.query;

    const thresholdsDays = { Platelet: 1, RBC: 7, FFP: 30, Cryo: 30 };
    const now = new Date();

    const compFilter = { status: 'in-stock' };
    if (siteId) compFilter.siteId = siteId;
    if (componentType) compFilter.componentType = componentType;

    const sort = { [sortBy]: order === 'asc' ? 1 : -1 };

    // Join Inventory->Component and filter by component expiry proximity
    const pipeline = [
      { $match: { status: 'in-stock' } },
      { $lookup: { from: 'components', localField: 'componentId', foreignField: '_id', as: 'component' } },
      { $unwind: '$component' },
      { $lookup: { from: 'bloodbags', localField: 'bagNo', foreignField: '_id', as: 'bag' } },
      { $unwind: '$bag' },
      { $match: compFilter },
      {
        $addFields: {
          daysToExpiry: {
            $ceil: {
              $divide: [{ $subtract: ['$component.expiryDate', now] }, 1000 * 60 * 60 * 24],
            },
          },
          threshold: {
            $cond: [
              { $eq: ['$component.componentType', 'Platelet'] }, thresholdsDays.Platelet,
              { $cond: [
                { $eq: ['$component.componentType', 'RBC'] }, thresholdsDays.RBC,
                { $cond: [
                  { $eq: ['$component.componentType', 'FFP'] }, thresholdsDays.FFP,
                  { $cond: [ { $eq: ['$component.componentType', 'Cryo'] }, thresholdsDays.Cryo, 7 ] }
                ] }
              ] }
            ]
          }
        },
      },
      {
        $match: {
          $expr: { $lte: [ '$daysToExpiry', '$threshold' ] }
        },
      },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          status: 1,
          inStockDate: 1,
          createdAt: 1,
          daysToExpiry: 1,
          component: {
            componentType: 1,
            volumeMl: 1,
            expiryDate: 1,
            siteId: 1,
          },
          bag: {
            bagNo: 1,
            segmentNo: 1,
            bloodGroup: 1,
            rh: 1,
          },
        },
      },
    ];

    const [items, totalAgg] = await Promise.all([
      Inventory.aggregate(pipeline),
      Inventory.aggregate([
        { $match: { status: 'in-stock' } },
        { $lookup: { from: 'components', localField: 'componentId', foreignField: '_id', as: 'component' } },
        { $unwind: '$component' },
        { $lookup: { from: 'bloodbags', localField: 'bagNo', foreignField: '_id', as: 'bag' } },
        { $unwind: '$bag' },
        { $match: compFilter },
        {
          $addFields: {
            daysToExpiry: {
              $ceil: {
                $divide: [{ $subtract: ['$component.expiryDate', now] }, 1000 * 60 * 60 * 24],
              },
            },
            threshold: {
              $cond: [
                { $eq: ['$component.componentType', 'Platelet'] }, thresholdsDays.Platelet,
                { $cond: [
                  { $eq: ['$component.componentType', 'RBC'] }, thresholdsDays.RBC,
                  { $cond: [
                    { $eq: ['$component.componentType', 'FFP'] }, thresholdsDays.FFP,
                    { $cond: [ { $eq: ['$component.componentType', 'Cryo'] }, thresholdsDays.Cryo, 7 ] }
                  ] }
                ] }
              ]
            }
          },
        },
        {
          $match: {
            $expr: { $lte: [ '$daysToExpiry', '$threshold' ] }
          },
        },
        { $count: 'count' },
      ]),
    ]);

    const total = totalAgg?.[0]?.count || 0;

    return res.status(200).json({
      success: true,
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

// POST /inventory/reserve – Reserve stock for request
async function reserveInventory(req, res, next) {
  try {
    const { inventoryIds = [], requestId, userId } = req.body;
    if (!Array.isArray(inventoryIds) || inventoryIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No inventory selected' });
    }
    const result = await Inventory.updateMany(
      { _id: { $in: inventoryIds }, status: 'in-stock' },
      { $set: { status: 'reserved', reservedFor: requestId || null, updatedAt: new Date(), updatedBy: userId } }
    );
    return res.status(200).json({ success: true, matched: result.matchedCount, modified: result.modifiedCount });
  } catch (err) {
    next(err);
  }
}

// POST /inventory/issue – Issue reserved stock
async function issueInventory(req, res, next) {
  try {
    const { inventoryIds = [], userId } = req.body;
    if (!Array.isArray(inventoryIds) || inventoryIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No inventory selected' });
    }
    const result = await Inventory.updateMany(
      { _id: { $in: inventoryIds }, status: 'reserved' },
      { $set: { status: 'issued', updatedAt: new Date(), updatedBy: userId } }
    );
    return res.status(200).json({ success: true, matched: result.matchedCount, modified: result.modifiedCount });
  } catch (err) {
    next(err);
  }
}

// POST /inventory/discard – Discard stock
async function discardInventory(req, res, next) {
  try {
    const { inventoryIds = [], reason = 'manual-discard', userId } = req.body;
    if (!Array.isArray(inventoryIds) || inventoryIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No inventory selected' });
    }
    const result = await Inventory.updateMany(
      { _id: { $in: inventoryIds }, status: { $in: ['in-stock', 'reserved'] } },
      { $set: { status: 'discarded', updatedAt: new Date(), updatedBy: userId } }
    );
    return res.status(200).json({ success: true, matched: result.matchedCount, modified: result.modifiedCount });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listInventory,
  getNearExpiryInventory,
  reserveInventory,
  issueInventory,
  discardInventory
};