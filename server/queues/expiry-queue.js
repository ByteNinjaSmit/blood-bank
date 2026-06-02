// queue/expiry-queue.js
const { createQueue } = require('../config/redis');
const { processExpiryReportJob } = require('../jobs/expiry-report-job');
const logger = require('../utils/logger');

// Validate Redis URL
if (!process.env.REDIS_URL) {
  logger.error('[Queue] REDIS_URL environment variable is not set');
  throw new Error('REDIS_URL environment variable is required');
}

let queue;
try {
  queue = createQueue('expiry-report', process.env.REDIS_URL);
  logger.info('[Queue] Expiry queue created successfully');
} catch (error) {
  logger.error('[Queue] Failed to create queue:', error.message);
  throw error;
}

// Add a simple test processor to debug
queue.process('test-job', 1, async (job) => {
  logger.info({ jobId: job.id }, '[Queue] Test job processing started');
  return { message: 'Test job completed' };
});

// Process jobs with proper job type handling
queue.process('daily-expiry-report', 1, processExpiryReportJob);
queue.process('manual-expiry-report', 1, processExpiryReportJob);

// Handle queue events
queue.on('error', (error) => {
  logger.error({ error: error.message }, '[Queue] Queue error occurred');
});

queue.on('failed', (job, err) => {
  logger.error({ jobId: job.id, jobType: job.name, error: err.message }, '[Queue] Job failed');
});

queue.on('completed', (job, result) => {
  logger.info({ jobId: job.id, jobType: job.name, result }, '[Queue] Job completed successfully');
});

queue.on('stalled', (job) => {
  logger.warn({ jobId: job.id, jobType: job.name }, '[Queue] Job stalled');
});

queue.on('waiting', (job) => {
  logger.info({ jobId: job.id, jobType: job.name }, '[Queue] Job waiting');
});

queue.on('active', (job) => {
  logger.info({ jobId: job.id, jobType: job.name }, '[Queue] Job started processing');
});

// Schedule: every day at 08:00 IST (currently set to every 2 minutes for testing)
async function schedule() {
  try {
    // Remove existing repeatable job if it exists
    const repeatableJobs = await queue.getRepeatableJobs();
    const existingJob = repeatableJobs.find((job) => job.name === 'daily-expiry-report');

    if (existingJob) {
      await queue.removeRepeatableByKey(existingJob.key);
      logger.info('[Queue] Removed existing repeatable job');
    }

    await queue.add(
      'daily-expiry-report',
      {},
      {
        jobId: 'daily-expiry-report',
        // repeat: { cron: '* * * * *', tz: process.env.TIMEZONE || 'Asia/Kolkata' },
        // repeat: { cron: '*/2 * * * *', tz: process.env.TIMEZONE || 'Asia/Kolkata' },
        repeat: { cron: '0 8 * * *', tz: process.env.TIMEZONE || 'Asia/Kolkata' }, // Production schedule
      },
    );
    logger.info('[Queue] Daily expiry report scheduled successfully');
  } catch (error) {
    logger.error({ error: error.message }, '[Queue] Failed to schedule daily expiry report');
    // Don't throw error to prevent server crash
  }
}

schedule().catch((error) => {
  logger.error({ error: error.message }, '[Queue] Failed to initialize queue schedule');
});

module.exports = queue;
