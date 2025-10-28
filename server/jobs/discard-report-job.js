/**
 * Discard Report Job
 * ----------------------------------------------
 * This job runs automatically (via Bull Queue)
 * every morning to:
 *   1. Identify components expiring today
 *   2. Discard them (update component + bag + inventory)
 *   3. Generate PDF report
 *   4. Send the report via email
 */

const logger = require('../utils/logger');
const { autoDiscardAndReport } = require('../services/auto-discard-service');
const { sendEmail } = require('../services/email-service');
const fs = require('fs');

const ADMIN_EMAILS = process.env.DISCARD_REPORT_EMAILS
  ? process.env.DISCARD_REPORT_EMAILS.split(',').map(e => e.trim())
  : [process.env.ADMIN_EMAIL || process.env.EMAIL_USER];

/**
 * Process Discard Report Job
 * ----------------------------
 * Called automatically by Bull when the job is due.
 */
async function processDiscardReportJob(job) {
  const jobName = job.name || 'daily-discard-job';
  const startedAt = new Date();

  logger.info(`[Job:${jobName}] 🚀 Starting auto-discard process at ${startedAt.toISOString()}`);

  try {
    // STEP 1️⃣: Run discard service
    const { filePath, count } = await autoDiscardAndReport();

    if (!count) {
      logger.info(`[Job:${jobName}] ✅ No expired components found today. Nothing to discard.`);
      return { success: true, count: 0, message: 'No expired components found today.' };
    }
    
    if (!filePath) {
      logger.warn(`[Job:${jobName}] Report PDF not generated; sending notification without attachment.`);
    }

    // STEP 2️⃣: Prepare email content
    const subject = `🩸 Auto Discard Report – ${count} Components Discarded (${new Date().toLocaleDateString()})`;
    const text = [
      `Dear Team,`,
      ``,
      `Please find attached the Auto Discard Report for ${new Date().toLocaleDateString()}.`,
      ``,
      `Summary:`,
      `• Total Components Discarded: ${count}`,
      `• Reason: Auto-expired components`,
      ``,
      `This process runs automatically every morning at 08:00 AM IST.`,
      ``,
      `Regards,`,
      `Blood Bank Automation System`,
    ].join('\n');

    // STEP 3️⃣: Send email
    for (const email of ADMIN_EMAILS) {
      try {
        await sendEmail(email, subject, text, filePath || null);
        logger.info(`[Job:${jobName}] 📧 Discard report sent to ${email}`);
      } catch (mailErr) {
        logger.error(`[Job:${jobName}] ❌ Failed to send email to ${email}: ${mailErr.message}`);
      }
    }

    // After all emails, delete file safely
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        logger.info(`[Job:${jobName}] 🧹 Deleted discard report file after sending: ${filePath}`);
      } catch (delErr) {
        logger.warn(`[Job:${jobName}] ⚠️ Failed to delete report file: ${delErr.message}`);
      }
    }


    // STEP 4️⃣: Log success
    const finishedAt = new Date();
    const durationSec = ((finishedAt - startedAt) / 1000).toFixed(2);
    logger.info(
      `[Job:${jobName}] ✅ Completed successfully — ${count} components discarded, took ${durationSec}s`
    );

    return {
      success: true,
      count,
      filePath,
      durationSec,
      message: 'Auto discard process completed successfully.',
    };

  } catch (error) {
    const failedAt = new Date();
    const durationSec = ((failedAt - startedAt) / 1000).toFixed(2);

    // logger.error({
    //   jobName,
    //   error: error.message,
    //   duration: `${durationSec}s`,
    //   stack: error.stack,
    // }, `[Job:${jobName}] ❌ Failed during auto-discard process`);
logger.error(`[Job:${jobName}] ❌ Failed during auto-discard process: ${error.message}`);
logger.error(error.stack);
    throw error; // Bull will automatically retry as per queue settings
  }
}

module.exports = { processDiscardReportJob };
