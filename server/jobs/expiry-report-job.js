// jobs/expiry-report-job.js
const logger = require('../utils/logger');
const { generateExpiryReportPDF } = require('../services/blood-expiry-service');
const { sendEmail } = require('../services/email-service');
const fs = require('fs');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

async function processExpiryReportJob(job) {
  logger.info({ jobId: job.id, jobType: job.name }, '[Expiry] Job started');

  try {
    // Validate admin email
    if (!ADMIN_EMAIL) {
      throw new Error('ADMIN_EMAIL environment variable is not configured');
    }

    // Generate PDF report
    const { filePath, count } = await generateExpiryReportPDF();

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
      `- Platelets: 1 day`,
      `- RBC: 7 days`,
      `- FFP: 30 days`,
      `- Cryo: 30 days`,
      ``,
      `Please review the attached report and take necessary action for components nearing expiry.`,
      ``,
      `Best regards,`,
      `Blood Bank Management System`,
      `Automated Report Generator`
    ].join('\n');

    // Send email with attachment
    await sendEmail(ADMIN_EMAIL, subject, text, filePath);

    logger.info({ jobId: job.id, filePath, count }, '[Expiry] Email sent successfully');
    return { filePath, count };
  } catch (error) {
    logger.error({ jobId: job.id, error: error.message, stack: error.stack }, '[Expiry] Job failed');
    throw error; // Re-throw to mark job as failed
  }
}

module.exports = { processExpiryReportJob };
