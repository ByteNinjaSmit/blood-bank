const { createQueue } = require('../config/redis');
const logger = require('../utils/logger');
const { processBirthdayJob } = require('../jobs/birthday-job');

const QUEUE_NAME = 'birthday-sms';
const JOB_NAME = 'daily-birthday-job';

if (!process.env.REDIS_URL) {
  logger.error('[Queue:Birthday] REDIS_URL is not configured');
  throw new Error('REDIS_URL required for Birthday queue');
}

const birthdayQueue = createQueue(QUEUE_NAME, process.env.REDIS_URL);

birthdayQueue.process(JOB_NAME, 1, async (job) => {
  return processBirthdayJob(job);
});

birthdayQueue.on('active', (job) => {
  logger.info(`[Queue:Birthday] Job active: ${job.id} (${job.name})`);
});

birthdayQueue.on('completed', (job, result) => {
  logger.info(`[Queue:Birthday] Job completed: ${job.id} (${job.name})`, { result });
});

birthdayQueue.on('failed', (job, err) => {
  logger.error(
    `[Queue:Birthday] Job failed: ${job && job.id} (${job && job.name}) - ${err.message}`,
  );
});

birthdayQueue.on('error', (error) => {
  logger.error(`[Queue:Birthday] Redis connection error: ${error.message}`);
});

async function scheduleBirthdayJob() {
  try {
    const existing = await birthdayQueue.getRepeatableJobs();
    const oldJob = existing.find((j) => j.name === JOB_NAME);

    if (oldJob) {
      await birthdayQueue.removeRepeatableByKey(oldJob.key);
    }

    await birthdayQueue.add(
      JOB_NAME,
      {},
      {
        jobId: JOB_NAME,
        repeat: {
          cron: '0 9 * * *',
          tz: process.env.TIMEZONE || 'Asia/Kolkata',
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    logger.info('[Queue:Birthday] Daily birthday SMS job scheduled successfully (09:00 IST)');
  } catch (error) {
    logger.error(`[Queue:Birthday] Failed to schedule birthday job: ${error.message}`);
  }
}

(async () => {
  try {
    await scheduleBirthdayJob();
    logger.info('[Queue:Birthday] Birthday queue initialized successfully');
  } catch (error) {
    logger.error(`[Queue:Birthday] Failed to initialize birthday queue: ${error.message}`);
  }
})();

process.on('SIGTERM', async () => {
  try {
    await birthdayQueue.close();
  } catch (error) {
    logger.error(`[Queue:Birthday] Error closing queue on SIGTERM: ${error.message}`);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  try {
    await birthdayQueue.close();
  } catch (error) {
    logger.error(`[Queue:Birthday] Error closing queue on SIGINT: ${error.message}`);
  }
  process.exit(0);
});

module.exports = birthdayQueue;
