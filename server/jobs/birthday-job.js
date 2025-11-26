const logger = require('../utils/logger');
const { getTodayBirthdayRecipients, buildBirthdayMessage } = require('../services/birthday-service');
const { sendSms } = require('../services/sms-service');

async function processBirthdayJob(job) {
  const jobName = (job && job.name) || 'daily-birthday-job';
  const startedAt = new Date();

  logger.info(`[BirthdayJob] Starting job ${jobName} at ${startedAt.toISOString()}`);

  try {
    const recipients = await getTodayBirthdayRecipients();

    if (!recipients || recipients.length === 0) {
      logger.info('[BirthdayJob] No birthdays found for today');
      return { success: true, count: 0, message: 'No birthdays today' };
    }

    let successCount = 0;
    let failureCount = 0;

    for (const recipient of recipients) {
      try {
        const body = buildBirthdayMessage(recipient);
        await sendSms({ to: recipient.phone, body });
        successCount += 1;
      } catch (error) {
        failureCount += 1;
        logger.error(
          `[BirthdayJob] Failed to send SMS to ${recipient.phone}: ${error.message}`
        );
      }
    }

    const finishedAt = new Date();
    const durationSec = ((finishedAt - startedAt) / 1000).toFixed(2);

    logger.info(
      `[BirthdayJob] Completed job ${jobName} — total: ${recipients.length}, success: ${successCount}, failed: ${failureCount}, duration: ${durationSec}s`
    );

    return {
      success: true,
      total: recipients.length,
      successCount,
      failureCount,
      durationSec,
    };
  } catch (error) {
    logger.error(`[BirthdayJob] Job ${jobName} failed: ${error.message}`);
    throw error;
  }
}

module.exports = { processBirthdayJob };
