const twilio = require('twilio');
const logger = require('../utils/logger');

let client;
let isInitialized = false;

function initializeTwilioClient() {
  if (isInitialized) {
    return !!client;
  }

  const requiredVars = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'];
  const missingVars = requiredVars.filter((name) => !process.env[name]);

  if (missingVars.length > 0) {
    logger.warn(`[Twilio] Missing configuration: ${missingVars.join(', ')}`);
    isInitialized = true;
    return false;
  }

  try {
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    isInitialized = true;
    logger.info('[Twilio] Client initialized successfully');
    return true;
  } catch (error) {
    isInitialized = true;
    logger.error(`[Twilio] Failed to initialize client: ${error.message}`);
    return false;
  }
}

function getTwilioClient() {
  if (!isInitialized) {
    initializeTwilioClient();
  }

  if (!client) {
    throw new Error('Twilio client is not configured correctly');
  }

  return client;
}

module.exports = { initializeTwilioClient, getTwilioClient };
