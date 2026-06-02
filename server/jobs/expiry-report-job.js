// jobs/expiry-report-job.js
const logger = require('../utils/logger');
const {
  generateExpiryReportPDF,
  findNearExpiryComponents,
  EXPIRY_THRESHOLDS,
} = require('../services/blood-expiry-service');
const { sendEmail } = require('../services/email-service');
const fs = require('fs');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

async function processExpiryReportJob(job) {
  logger.info('[Expiry] Job started', { jobId: job.id, jobType: job.name });

  try {
    // Validate admin email
    if (!ADMIN_EMAIL) {
      throw new Error('ADMIN_EMAIL environment variable is not configured');
    }

    // Step 1: Find near expiry components first
    const components = await findNearExpiryComponents();
    const count = components.length;

    if (count === 0) {
      logger.info('[Expiry] No components near expiry found. Skipping email.', { jobId: job.id });
      return { count: 0, message: 'No near-expiry components found' };
    }

    // Step 3: Generate PDF report using the fetched components
    const { filePath } = await generateExpiryReportPDF(components);

    // Verify PDF file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`Generated PDF file not found: ${filePath}`);
    }

    // Prepare email content
    const subject = `Near Expiry Blood Components Report (${new Date().toLocaleDateString()}) – ${count} item(s)`;
    const text = [
      `Dear Blood Bank Administrator,`,
      ``,
      `Please find attached the near-expiry blood components report.`,
      ``,
      `Report Summary:`,
      `- Total components near expiry: ${count}`,
      `- Report date: ${new Date().toLocaleDateString()}`,
      `- Generated at: ${new Date().toLocaleTimeString()}`,
      ``,
      `Component-specific thresholds used:`,
      `- Platelets: ${EXPIRY_THRESHOLDS.Platelet} days`,
      `- RBC: ${EXPIRY_THRESHOLDS.RBC} days`,
      `- FFP: ${EXPIRY_THRESHOLDS.FFP} days`,
      `- Cryo: ${EXPIRY_THRESHOLDS.Cryo} days`,
      ``,
      `Please review the attached report and take necessary action for components nearing expiry.`,
      ``,
      `Best regards,`,
      `Blood Bank Management System`,
      `Automated Report Generator`,
    ].join('\n');

    // Send email with attachment
    await sendEmail(ADMIN_EMAIL, subject, text, filePath);

    logger.info('[Expiry] Email sent successfully', { jobId: job.id, filePath, count });
    return { filePath, count };
  } catch (error) {
    logger.error('[Expiry] Job failed', {
      jobId: job.id,
      error: error.message,
      stack: error.stack,
    });
    throw error; // Re-throw to mark job as failed
  }
}

module.exports = { processExpiryReportJob };
