// services/auto-discard-service.js
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

const Component = require('../models/component-model');
const DiscardLog = require('../models/discard-model'); // your DiscardLog model
const Inventory = require('../models/inventory-model');
const BloodBag = require('../models/bloodbag-model');
const { generateDiscardPDF } = require('../lib/discard-pdfGenerator');

const REPORTS_DIR = process.env.REPORTS_DIR || './reports';
const SYSTEM_USER_ID = process.env.SYSTEM_USER_ID || '68acce6acb0096e64764d7d6'; // RECOMMEND: set this in .env

function ensureDir() {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
    logger.info(`[Discard] Created reports directory at ${REPORTS_DIR}`);
  }
}

function getDayBounds(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function buildSummary(rows) {
  const map = new Map();
  for (const r of rows) {
    const key = `${r.componentType}||${r.donationId?.bloodGroup || 'Unknown'}||${r.donationId?.rh || 'Unknown'}`;
    map.set(key, (map.get(key) || 0) + 1);
  }
  return [...map.entries()].map(([key, count]) => {
    const [componentType, bloodGroup, rh] = key.split('||');
    return { componentType, bloodGroup, rh, count };
  });
}

async function autoDiscardAndReport() {
  ensureDir();
  const { start, end } = getDayBounds();
  logger.info(`[Discard] Checking for expired components (expiryDate ≤ ${end.toISOString()})`);

  // find components expired up to today that are still active
  const expiredComponents = await Component.find({
    expiryDate: { $lte: end },
    status: { $in: ['in-stock', 'testing', 'available', 'ready'] }
  })
    .populate('donationId', 'bagNo bloodGroup rh status')
    .populate('siteId', 'name')
    .lean();

  if (!expiredComponents.length) {
    logger.info('[Discard] ✅ No expired components pending discard.');
    return { filePath: null, count: 0, expiredComponents: [] };
  }

  logger.info(`[Discard] Found ${expiredComponents.length} expired components requiring auto-discard.`);

  const session = await mongoose.startSession();
  session.startTransaction();

  let filePath = null;

  try {
    const compIds = expiredComponents.map(c => c._id);
    const now = new Date();

    // 1) update components in a single updateMany
    await Component.updateMany(
      { _id: { $in: compIds } },
      {
        $set: {
          status: 'discarded',
          discardReason: 'Auto Expired',
          discardedAt: now,
          inventoryStatus: 'not-available',
          updatedAt: now
        }
      },
      { session }
    );

    // 2) update inventories (mark discarded)
    await Inventory.updateMany(
      { componentId: { $in: compIds } },
      { $set: { status: 'discarded', available: false, updatedAt: now } },
      { session }
    );

    // 3) create DiscardLog records that match schema
    // Ensure SYSTEM_USER_ID exists (fallback to null will fail schema if required — prefer setting env)
    if (!SYSTEM_USER_ID) {
      logger.warn('[Discard] SYSTEM_USER_ID not set. Please set process.env.SYSTEM_USER_ID to a valid User ObjectId for audit logs.');
    }

    const discardRecords = expiredComponents.map(c => ({
      itemType: 'Component',
      bagNo: c.donationId?._id || null,
      reason: 'Auto Expired',
      discardedAt: now,
      siteId: c.siteId?._id || null,
      updatedBy: SYSTEM_USER_ID ? new mongoose.Types.ObjectId(SYSTEM_USER_ID) : '68acce6acb0096e64764d7d6', // if schema requires updatedBy, ensure env set
      createdAt: now
    }));

    // If your schema marks some fields required, ensure they are present. Optionally filter invalid entries:
    const validDiscardRecords = discardRecords.filter(r => r.bagNo && r.discardedAt && r.updatedBy);
    if (validDiscardRecords.length !== discardRecords.length) {
      logger.warn(`[Discard] Some discard records missing required fields and will be skipped. expected:${discardRecords.length} valid:${validDiscardRecords.length}`);
    }

    // insertMany ordered:false so single invalid doc doesn't stop all (but here we filtered invalids)
    if (validDiscardRecords.length) {
      await DiscardLog.insertMany(validDiscardRecords, { session, ordered: false });
    }

    // 4) Update bag statuses if all components are discarded
    const affectedBagIds = [...new Set(expiredComponents.map(c => c.donationId?._id).filter(Boolean))];
    for (const bagId of affectedBagIds) {
      const remaining = await Component.countDocuments({ donationId: bagId, status: { $nin: ['discarded'] } }, { session });
      if (remaining === 0) {
        await BloodBag.updateOne({ _id: bagId }, { $set: { status: 'discarded', updatedAt: now } }, { session });
        logger.info(`[Discard] Bag ${bagId} marked as discarded (all components expired).`);
      }
    }

    // commit DB transaction and end session BEFORE doing non-DB work
    await session.commitTransaction();
    session.endSession();

    logger.info(`[Discard] 🩸 Successfully discarded ${expiredComponents.length} expired components.`);

    // generate PDF outside the transaction (so failures here don't require aborting DB changes)
    try {
      const summary = buildSummary(expiredComponents);
      const detailRows = expiredComponents.map(e => ({
        bagNo: e.donationId?.bagNo || 'Unknown',
        componentType: e.componentType,
        bloodGroup: e.donationId?.bloodGroup || 'Unknown',
        rh: e.donationId?.rh || 'Unknown',
        expiryDate: e.expiryDate,
        siteName: e.siteId?.name || 'Unknown',
        reason: 'Auto Expired'
      }));

      filePath = await generateDiscardPDF({
        reportDir: path.resolve(REPORTS_DIR),
        title: 'Auto Discard Report',
        subtitle: `Expired Components (up to ${new Date().toLocaleDateString()})`,
        summaryRows: summary,
        detailRows
      });

      logger.info(`[Discard] 🧾 Auto discard report generated: ${filePath}`);
    } catch (pdfErr) {
      // PDF failed — but DB changes already committed. Log and return with filePath=null
      logger.error(`[Discard] ⚠️ Failed to generate discard PDF after commit: ${pdfErr.message}`);
      logger.error(pdfErr.stack);
      filePath = null;
    }

    return { filePath, count: expiredComponents.length, expiredComponents };

  } catch (error) {
    // Abort only if transaction is still active
    try {
      if (session.inTransaction()) {
        await session.abortTransaction();
        logger.info('[Discard] Transaction aborted due to error.');
      }
    } catch (abortErr) {
      // If abort fails (e.g., after commit), log the situation — don't rethrow abort error
      logger.warn('[Discard] Warning while aborting transaction:', abortErr.message || abortErr);
    } finally {
      session.endSession();
    }

    logger.error(`[Discard] ❌ Transaction failed: ${error.message}`);
    logger.error(error.stack || error);
    throw error;
  }
}

module.exports = { autoDiscardAndReport };
