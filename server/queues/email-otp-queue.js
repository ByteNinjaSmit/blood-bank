// queues/email-otp-queue.js
const { createQueue } = require('../config/redis');
const logger = require('../utils/logger');
const { processEmailOtpJob } = require('../jobs/email-otp-job');

const QUEUE_NAME = 'email-otp';

if (!process.env.REDIS_URL) {
  logger.error('[Queue:EmailOTP] ❌ REDIS_URL is not configured');
  throw new Error('REDIS_URL required for Email OTP queue');
}

const emailOtpQueue = createQueue(QUEUE_NAME, process.env.REDIS_URL);

emailOtpQueue.process('send-email-otp', 5, async (job) => {
  return processEmailOtpJob(job);
});

emailOtpQueue.on('active', (job) => {
  logger.info({ jobId: job.id, name: job.name }, '[Queue:EmailOTP] Job active');
});
emailOtpQueue.on('completed', (job, result) => {
  logger.info({ jobId: job.id, name: job.name, result }, '[Queue:EmailOTP] ✅ Job completed');
});
emailOtpQueue.on('failed', (job, err) => {
  logger.error({ jobId: job.id, name: job.name, error: err.message }, '[Queue:EmailOTP] ❌ Job failed');
});
emailOtpQueue.on('error', (error) => {
  logger.error({ error: error.message }, '[Queue:EmailOTP] ❌ Redis connection error');
});

module.exports = emailOtpQueue;
