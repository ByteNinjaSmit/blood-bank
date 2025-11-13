// services/email-service.js
const logger = require("../utils/logger");

let transporter;
let isInitialized = false;

// Initialize email transporter with error handling
function initializeEmailTransporter() {
  if (isInitialized) {
    return !!transporter;
  }

  try {
    // Only require creds that mailConfig actually uses
    const requiredEmailVars = ['EMAIL_USER', 'EMAIL_PASS'];
    const missingVars = requiredEmailVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      logger.warn(`[Email] Missing email configuration: ${missingVars.join(', ')}`);
      isInitialized = true;
      return false;
    }

    // mailConfig exports a ready transporter (it already sets host/port)
    transporter = require("../config/mailConfig");
    logger.info("[Email] Email transporter initialized successfully");
    isInitialized = true;
    return true;
  } catch (error) {
    logger.error("[Email] Failed to initialize email transporter:", error);
    isInitialized = true;
    return false;
  }
}

async function sendEmail(to, subject, text, attachmentPath, html) {
  // Initialize transporter if not already done
  if (!isInitialized) {
    initializeEmailTransporter();
  }

  if (!transporter) {
    throw new Error("Email service not configured - missing environment variables (EMAIL_USER/EMAIL_PASS)");
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
    attachments: attachmentPath ? [{ path: attachmentPath }] : [],
  };

  try {
    logger.info({ to, subject, hasAttachment: !!attachmentPath }, "[Email] Attempting to send email");

    const info = await transporter.sendMail(mailOptions);
    logger.info({ messageId: info.messageId, to }, "[Email] Email sent successfully");
    return info;
  } catch (err) {
    logger.error({ error: err.message, to, subject }, "[Email] Failed to send email");
    throw new Error(`Email sending failed: ${err.message}`);
  }
}

module.exports = { sendEmail };
