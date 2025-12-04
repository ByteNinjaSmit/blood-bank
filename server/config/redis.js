// ./config/redis.js
const Queue = require('bull');
const logger = require('../utils/logger');

function createQueue(name, redisUrl) {
  // Parse redis://redis:6379 to host and port for Bull
  let redisConfig;
  if (redisUrl.includes('://')) {
    const url = new URL(redisUrl);
    redisConfig = {
      host: url.hostname,
      port: parseInt(url.port) || 6379,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: false
    };
  } else {
    redisConfig = {
      url: redisUrl,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: false
    };
  }

  const opts = {
    redis: redisConfig,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 60_000 },
      removeOnComplete: true,
      removeOnFail: false
    },
    settings: { 
      lockDuration: 300_000,
      stalledInterval: 60_000,
      maxStalledCount: 2
    }
  };

  try {
    const queue = new Queue(name, opts);
    
    // Add error handling for Redis connection
    queue.on('error', (error) => {
      logger.error({ error: error.message }, `[Queue:${name}] Redis connection error`);
    });
    
    queue.on('failed', (job, err) => {
      logger.error({ jobId: job.id, error: err.message }, `[Queue:${name}] Job failed`);
    });
    
    queue.on('completed', (job, result) => {
      logger.info({ jobId: job.id }, `[Queue:${name}] Job completed successfully`);
    });
    
    return queue;
  } catch (error) {
    logger.error({ error: error.message }, `[Queue:${name}] Failed to create queue`);
    throw error;
  }
}

module.exports = { createQueue };
