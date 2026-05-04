// services/blood-expiry-service.js
const path = require('path');
const fs = require('fs');
const BloodBag = require('../models/bloodbag-model');
const logger = require('../utils/logger');
const { generateNearExpiryPDF } = require('../lib/pdfGenerator');
const Component = require('../models/component-model');

const NEAR_EXPIRY_DAYS = Number(process.env.NEAR_EXPIRY_DAYS || 5);
const REPORTS_DIR = process.env.REPORTS_DIR || './reports';

const EXPIRY_THRESHOLDS = {
  Platelet: 2,
  RBC: 7,
  FFP: 30,
  Cryo: 30
};

// Ensure reports directory exists
function ensureReportsDirectory() {
  if (!fs.existsSync(REPORTS_DIR)) {
    try {
      fs.mkdirSync(REPORTS_DIR, { recursive: true });
      logger.info(`[Expiry] Created reports directory: ${REPORTS_DIR}`);
    } catch (error) {
      logger.error('[Expiry] Failed to create reports directory', { error: error.message });
      throw new Error(`Failed to create reports directory: ${error.message}`);
    }
  }
}

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0,0,0,0);
  return x;
}

function endOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23,59,59,999);
  return x;
}

/**
 * Returns all components with expiryDate based on component-specific thresholds
 */
async function findNearExpiryComponents() {
  try {
    const today = startOfDay();

    const filter = {
      status: "in-stock", // only in-stock components
      $or: []
    };

    Object.entries(EXPIRY_THRESHOLDS).forEach(([componentType, days]) => {
      const from = today;
      const to = endOfDay(new Date(Date.now() + days * 24 * 60 * 60 * 1000));
      
      filter.$or.push({
        componentType: componentType,
        expiryDate: { $gte: from, $lte: to }
      });
    });

    const components = await Component.find(filter)
      .populate({
        path: "donationId",
        select: "bagNo bloodGroup rh collectionDate",
        model: "BloodBag"
      })
      .populate({
        path: "siteId",
        select: "name",
        model: "Site"
      })
      .sort({ expiryDate: 1 }); // soonest expiry first

    logger.info('[Expiry] Found near expiry in-stock components', { count: components.length });
    return components;

  } catch (error) {
    logger.error('[Expiry] Failed to find near expiry components', { error: error.message });
    throw error;
  }
}


function buildSummary(rows) {
  const map = new Map();

  for (const r of rows) {
    const bloodGroup = r.donationId?.bloodGroup || 'Unknown';
    const rh = r.donationId?.rh || 'Unknown';
    const key = `${r.componentType}||${bloodGroup}||${rh}`;

    map.set(key, (map.get(key) || 0) + 1);
  }

  return [...map.entries()].map(([k, count]) => {
    const [componentType, bloodGroup, rh] = k.split('||');
    return { componentType, bloodGroup, rh, count };
  }).sort((a, b) => 
    a.componentType.localeCompare(b.componentType) || 
    a.bloodGroup.localeCompare(b.bloodGroup) || 
    a.rh.localeCompare(b.rh)
  );
}


/**
 * Generates the PDF and returns { filePath, count }
 */
async function generateExpiryReportPDF(providedData = null) {
  try {
    // Ensure reports directory exists
    ensureReportsDirectory();
    
    const data = providedData || await findNearExpiryComponents();
    const summary = buildSummary(data);
    const todayLabel = new Date().toISOString().slice(0,10); // YYYY-MM-DD

    // Transform data for PDF generation
    const transformedData = data.map(component => ({
      componentId: component.componentId,
      componentType: component.componentType,
      bloodGroup: component.donationId?.bloodGroup || 'Unknown',
      rh: component.donationId?.rh || 'Unknown',
      volumeMl: component.volumeMl,
      expiryDate: component.expiryDate,
      status: component.status,
      storageLocation: component.storageLocation || 'Not specified',
      siteName: component.siteId?.name || 'Unknown',
      collectionDate: component.donationId?.collectionDate,
      bagNo: component.donationId?.bagNo || 'Unknown'
    }));

    const filePath = await generateNearExpiryPDF({
      title: `Near Expiry Blood Components Report`,
      subtitle: `Generated on ${new Date().toLocaleDateString()}`,
      reportDir: path.resolve(REPORTS_DIR),
      dateLabel: todayLabel,
      summaryRows: summary,
      detailRows: transformedData
    });

    logger.info('[Expiry] PDF generated successfully', { count: data.length, filePath });
    return { filePath, count: data.length };
  } catch (error) {
    logger.error('[Expiry] Failed to generate PDF', { error: error.message, stack: error.stack });
    throw error;
  }
}

module.exports = {
  findNearExpiryComponents,
  generateExpiryReportPDF,
  EXPIRY_THRESHOLDS
};
