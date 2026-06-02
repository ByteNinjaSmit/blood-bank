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
const Hospital = require('../models/hospital-model');

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
    if (componentType) compFilter['component.componentType'] = componentType;
    if (siteId) compFilter['component.siteId'] = siteId;

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
      {
        $lookup: {
          from: 'components',
          localField: 'componentId',
          foreignField: '_id',
          as: 'component',
        },
      },
      { $unwind: '$component' },
      { $lookup: { from: 'bloodbags', localField: 'bagNo', foreignField: '_id', as: 'bag' } },
      { $unwind: '$bag' },
      {
        $lookup: {
          from: 'hospitals',
          localField: 'reservedForHospital',
          foreignField: '_id',
          as: 'hospital',
        },
      },
      { $unwind: { path: '$hospital', preserveNullAndEmptyArrays: true } },
      // Also join requisition to get hospital and patient when reserved via request
      {
        $lookup: {
          from: 'hospitalrequests',
          localField: 'reservedFor',
          foreignField: '_id',
          as: 'request',
        },
      },
      { $unwind: { path: '$request', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'hospitals',
          localField: 'request.hospitalId',
          foreignField: '_id',
          as: 'reqHospital',
        },
      },
      { $unwind: { path: '$reqHospital', preserveNullAndEmptyArrays: true } },
      { $addFields: { hospital: { $ifNull: ['$hospital', '$reqHospital'] } } },
      { $match: compFilter },
      ...(search ? [{ $match: { 'bag.bagNo': { $regex: search, $options: 'i' } } }] : []),
      {
        $project: {
          _id: 1,
          status: 1,
          inStockDate: 1,
          createdAt: 1,
          updatedAt: 1,
          issuedAt: 1,
          issuedBy: 1,
          reservedFor: 1,
          reservedForHospital: 1,
          reservedAt: 1,
          reservedUntil: 1,
          reservedPatientName: 1,
          reservedPatientAge: 1,
          reservedPatientSex: 1,
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
          'hospital._id': 1,
          'hospital.name': 1,
          'request.patient': 1,
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
        {
          $lookup: {
            from: 'components',
            localField: 'componentId',
            foreignField: '_id',
            as: 'component',
          },
        },
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

async function reserveByCriteriaFIFO(req, res, next) {
  try {
    const now = new Date();
    const { hospitalId, reservedUntil, items = [], siteId, patient } = req.body || {};
    if (!hospitalId) {
      return res.status(400).json({ success: false, message: 'hospitalId is required' });
    }
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) return res.status(404).json({ success: false, message: 'Hospital not found' });
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items to reserve' });
    }
    if (
      !patient ||
      !patient.name ||
      patient.sex == null ||
      patient.age == null ||
      Number.isNaN(Number(patient.age))
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'Patient name, age and sex are required for reservation',
        });
    }
    const until = reservedUntil ? new Date(reservedUntil) : null;
    const pn = patient?.name || null;
    const pa =
      typeof patient?.age === 'number' ? patient.age : patient?.age ? Number(patient.age) : null;
    const ps = patient?.sex || null;
    const selections = [];
    const shortages = [];
    for (const rc of items) {
      if (!rc?.componentType || !rc?.units || !rc?.bloodGroup || !rc?.rh) {
        return res.status(400).json({ success: false, message: 'Invalid item' });
      }
      const compFilter = { 'component.componentType': rc.componentType };
      if (siteId) compFilter['component.siteId'] = siteId;
      const pipeline = [
        { $match: { status: 'in-stock' } },
        {
          $lookup: {
            from: 'components',
            localField: 'componentId',
            foreignField: '_id',
            as: 'component',
          },
        },
        { $unwind: '$component' },
        { $lookup: { from: 'bloodbags', localField: 'bagNo', foreignField: '_id', as: 'bag' } },
        { $unwind: '$bag' },
        {
          $match: {
            ...compFilter,
            'bag.bloodGroup': rc.bloodGroup,
            'bag.rh': rc.rh,
            'component.expiryDate': { $gte: now },
          },
        },
        { $sort: { inStockDate: 1, 'component.expiryDate': 1 } },
        { $limit: rc.units },
        { $project: { _id: 1 } },
      ];
      const docs = await Inventory.aggregate(pipeline);
      const ids = docs.map((d) => d._id);
      if (ids.length < rc.units) {
        shortages.push({
          componentType: rc.componentType,
          required: rc.units,
          available: ids.length,
        });
      }
      selections.push(...ids);
    }
    if (shortages.length) {
      return res
        .status(409)
        .json({ success: false, message: 'Insufficient stock to reserve', data: { shortages } });
    }
    const upd = await Inventory.updateMany(
      { _id: { $in: selections }, status: 'in-stock' },
      {
        $set: {
          status: 'reserved',
          reservedForHospital: hospitalId,
          reservedAt: now,
          reservedUntil: until,
          reservedPatientName: pn,
          reservedPatientAge: pa,
          reservedPatientSex: ps,
        },
      },
    );
    if (upd.modifiedCount !== selections.length) {
      return res
        .status(409)
        .json({ success: false, message: 'Concurrent update detected while reserving' });
    }
    const details = await Inventory.aggregate([
      { $match: { _id: { $in: selections } } },
      {
        $lookup: {
          from: 'components',
          localField: 'componentId',
          foreignField: '_id',
          as: 'component',
        },
      },
      { $unwind: '$component' },
      { $lookup: { from: 'bloodbags', localField: 'bagNo', foreignField: '_id', as: 'bag' } },
      { $unwind: '$bag' },
      {
        $project: {
          _id: 1,
          status: 1,
          inStockDate: 1,
          createdAt: 1,
          reservedFor: 1,
          reservedForHospital: 1,
          reservedAt: 1,
          reservedUntil: 1,
          reservedPatientName: 1,
          reservedPatientAge: 1,
          reservedPatientSex: 1,
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
    ]);
    return res
      .status(200)
      .json({
        success: true,
        data: { matchedCount: selections.length, inventoryIds: selections, items: details },
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
      {
        $lookup: {
          from: 'components',
          localField: 'componentId',
          foreignField: '_id',
          as: 'component',
        },
      },
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
              { $eq: ['$component.componentType', 'Platelet'] },
              thresholdsDays.Platelet,
              {
                $cond: [
                  { $eq: ['$component.componentType', 'RBC'] },
                  thresholdsDays.RBC,
                  {
                    $cond: [
                      { $eq: ['$component.componentType', 'FFP'] },
                      thresholdsDays.FFP,
                      {
                        $cond: [
                          { $eq: ['$component.componentType', 'Cryo'] },
                          thresholdsDays.Cryo,
                          7,
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
      {
        $match: {
          $expr: {
            $and: [{ $gte: ['$daysToExpiry', 0] }, { $lte: ['$daysToExpiry', '$threshold'] }],
          },
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
        {
          $lookup: {
            from: 'components',
            localField: 'componentId',
            foreignField: '_id',
            as: 'component',
          },
        },
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
                { $eq: ['$component.componentType', 'Platelet'] },
                thresholdsDays.Platelet,
                {
                  $cond: [
                    { $eq: ['$component.componentType', 'RBC'] },
                    thresholdsDays.RBC,
                    {
                      $cond: [
                        { $eq: ['$component.componentType', 'FFP'] },
                        thresholdsDays.FFP,
                        {
                          $cond: [
                            { $eq: ['$component.componentType', 'Cryo'] },
                            thresholdsDays.Cryo,
                            7,
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
        {
          $match: {
            $expr: {
              $and: [{ $gte: ['$daysToExpiry', 0] }, { $lte: ['$daysToExpiry', '$threshold'] }],
            },
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
      {
        $set: {
          status: 'reserved',
          reservedFor: requestId || null,
          updatedAt: new Date(),
          updatedBy: userId,
        },
      },
    );
    return res
      .status(200)
      .json({ success: true, matched: result.matchedCount, modified: result.modifiedCount });
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
    const now = new Date();
    const result = await Inventory.updateMany(
      { _id: { $in: inventoryIds }, status: 'reserved' },
      { $set: { status: 'issued', issuedAt: now, issuedBy: userId, updatedAt: now } },
    );
    return res
      .status(200)
      .json({ success: true, matched: result.matchedCount, modified: result.modifiedCount });
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
      { $set: { status: 'discarded', updatedAt: new Date(), updatedBy: userId } },
    );
    return res
      .status(200)
      .json({ success: true, matched: result.matchedCount, modified: result.modifiedCount });
  } catch (err) {
    next(err);
  }
}

// POST /inventory/unreserve – Unreserve stock (revert to in-stock)
async function unreserveInventory(req, res, next) {
  try {
    const { inventoryIds = [], userId } = req.body;
    if (!Array.isArray(inventoryIds) || inventoryIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No inventory selected' });
    }
    const result = await Inventory.updateMany(
      { _id: { $in: inventoryIds }, status: 'reserved' },
      {
        $set: {
          status: 'in-stock',
          updatedAt: new Date(),
          updatedBy: userId,
        },
        $unset: {
          reservedFor: '',
          reservedForHospital: '',
          reservedAt: '',
          reservedUntil: '',
          reservedPatientName: '',
          reservedPatientAge: '',
          reservedPatientSex: '',
        },
      },
    );
    return res
      .status(200)
      .json({ success: true, matched: result.matchedCount, modified: result.modifiedCount });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listInventory,
  getNearExpiryInventory,
  reserveInventory,
  reserveByCriteriaFIFO,
  issueInventory,
  discardInventory,
  unreserveInventory,
};
