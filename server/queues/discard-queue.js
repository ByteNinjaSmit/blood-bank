// queues/discard-queue.js
/**
 * Discard Queue – Auto discard expired blood components daily.
 * Runs via Bull with Redis backend.
 *
 * Schedule: Every day at 08:00 AM IST
 */

const { createQueue } = require('../config/redis');
const logger = require('../utils/logger');
const { processDiscardReportJob } = require('../jobs/discard-report-job');

const QUEUE_NAME = 'discard-report';
const JOB_NAME = 'daily-discard-job';

// --- Validate environment configuration ---
if (!process.env.REDIS_URL) {
  logger.error('[Queue:Discard] ❌ REDIS_URL is not configured');
  throw new Error('REDIS_URL required for discard queue');
}

// --- Initialize queue ---
const discardQueue = createQueue(QUEUE_NAME, process.env.REDIS_URL);

// --- Register job processor ---
discardQueue.process(JOB_NAME, 1, async (job) => {
  try {
    logger.info({ jobId: job.id, jobName: job.name }, '[Queue:Discard] Started job');
    const result = await processDiscardReportJob(job);
    logger.info({ jobId: job.id, result }, '[Queue:Discard] Job processed successfully');
    return result;
  } catch (err) {
    logger.error(`[Queue:Discard] ❌ Job processing failed for ${job.id}: ${err.message}`);
    logger.error(err.stack);
    throw err;
  }
});

// --- Queue lifecycle logging ---
discardQueue.on('active', (job) => {
  logger.info({ jobId: job.id, name: job.name }, '[Queue:Discard] Job active');
});

discardQueue.on('completed', (job, result) => {
  logger.info({ jobId: job.id, name: job.name, result }, '[Queue:Discard] ✅ Job completed');
});

discardQueue.on('failed', (job, err) => {
  logger.error(
    { jobId: job.id, name: job.name, error: err.message },
    '[Queue:Discard] ❌ Job failed',
  );
});

discardQueue.on('error', (error) => {
  logger.error({ error: error.message }, '[Queue:Discard] ❌ Redis connection error');
});

discardQueue.on('stalled', (job) => {
  logger.warn({ jobId: job.id }, '[Queue:Discard] ⚠️ Job stalled - retrying');
});

// --- Job scheduler ---
async function scheduleDiscardJob() {
  try {
    logger.info('[Queue:Discard] Checking for existing repeatable jobs...');
    const existing = await discardQueue.getRepeatableJobs();

    // Prevent duplicate scheduling
    const oldJob = existing.find((j) => j.name === JOB_NAME);
    if (oldJob) {
      await discardQueue.removeRepeatableByKey(oldJob.key);
      logger.info('[Queue:Discard] Removed old scheduled job to prevent duplication');
    }

    // Add new repeatable job
    await discardQueue.add(
      JOB_NAME,
      {},
      {
        jobId: JOB_NAME,
        repeat: {
          // cron: '*/2 * * * *',
          cron: '0 8 * * *', // 08:00 AM every day
          tz: process.env.TIMEZONE || 'Asia/Kolkata',
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    logger.info('[Queue:Discard] ✅ Daily auto-discard job scheduled successfully (08:00 IST)');
  } catch (error) {
    logger.error({ error: error.message }, '[Queue:Discard] ❌ Failed to schedule discard job');
  }
}

// --- Graceful initialization ---
(async () => {
  try {
    await scheduleDiscardJob();
    logger.info('[Queue:Discard] 🚀 Discard queue initialized successfully');
  } catch (error) {
    logger.error(
      { error: error.message },
      '[Queue:Discard] ❌ Failed to initialize auto-discard queue schedule',
    );
  }
})();

// --- Optional graceful shutdown ---
process.on('SIGTERM', async () => {
  logger.warn('[Queue:Discard] 🧹 SIGTERM received, closing queue...');
  await discardQueue.close();
  logger.info('[Queue:Discard] Queue closed cleanly');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.warn('[Queue:Discard] 🧹 SIGINT received, closing queue...');
  await discardQueue.close();
  logger.info('[Queue:Discard] Queue closed cleanly');
  process.exit(0);
});

module.exports = discardQueue;
