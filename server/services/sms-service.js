const logger = require('../utils/logger');
const { getTwilioClient } = require('../config/twilio');

function normalizePhone(phone) {
  if (!phone) {
    throw new Error('Phone number is required');
  }
  const trimmed = String(phone).trim();
  return trimmed.startsWith('+') ? trimmed : `+91${trimmed}`;
}

async function sendSms({ to, body }) {
  if (!to || !body) {
    throw new Error('Both "to" and "body" are required to send SMS');
  }

  const client = getTwilioClient();
  const toNumber = normalizePhone(to);

  try {
    logger.info(`[SMS] Sending SMS to ${toNumber}`);
    const response = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: toNumber,
    });
    logger.info(`[SMS] SMS sent to ${toNumber} with SID ${response.sid}`);
    return response;
  } catch (error) {
    logger.error(`[SMS] Failed to send SMS to ${toNumber}: ${error.message}`);
    throw error;
  }
}

module.exports = { sendSms };
