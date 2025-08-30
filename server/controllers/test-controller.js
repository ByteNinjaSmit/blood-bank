// controllers/test-controller.js
const { sendEmail } = require("../services/email-service");
const queue = require("../queues/expiry-queue");
const logger = require("../utils/logger");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const { Readable } = require("stream");

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const SEND_TO = process.env.ADMIN_EMAIL;

const host = process.env.EMAIL_HOST || "smtp.gmail.com";
const port = Number(process.env.EMAIL_PORT || 465);
const secure = process.env.EMAIL_SECURE
  ? process.env.EMAIL_SECURE === "true"
  : port === 465;

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter.verify((error, success) => {
    if (error) {
      console.log("Email configuration error:", error);
    } else {
      console.log("Email server is ready to take our messages");
    }
  });
} else {
  console.log("Email credentials not configured - skipping verification");
}

// ============ HELPERS ============
const generateExpiryPDFBuffer = async () => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks = [];
    doc.text("📄 Expiry Report");
    doc.moveDown();
    doc.text(`Generated at: ${new Date().toLocaleString()}`);
    doc.text("===================================");
    doc.text("This is a test expiry report PDF.");
    doc.end();

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
};

exports.sendTestEmail = async (req, res) => {
  try {
    const { to, subject, text } = req.body;

    if (!to || !subject || !text) {
      return res.status(400).json({
        success: false,
        error: "to, subject, and text are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
    }

    logger.info({ to, subject }, "[Test] Sending test email");
    await sendEmail(to, subject, text);

    res.status(200).json({
      success: true,
      message: "Test email sent successfully!",
    });
  } catch (err) {
    logger.error({ error: err.message }, "[Test] Failed to send test email");
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

exports.triggerNow = async (req, res) => {
  try {
    logger.info("[Test] Manually triggering expiry report");

    const job = await queue.add(
      "manual-expiry-report",
      {},
      {
        removeOnComplete: true,
        removeOnFail: false,
      }
    );

    logger.info({ jobId: job.id }, "[Test] Manual expiry report job created");

    res.json({
      success: true,
      message: "Manual expiry report enqueued",
      jobId: job.id,
    });
  } catch (err) {
    logger.error(
      { error: err.message },
      "[Test] Failed to trigger expiry report"
    );
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

exports.sendReport = async (req, res) => {
  try {
    const pdfBuffer = await generateExpiryPDFBuffer();

    await transporter.sendMail({
      from: EMAIL_USER,
      to: SEND_TO,
      subject: "Expiry Report (Manual Trigger)",
      text: "Attached is your manually triggered expiry report.",
      attachments: [
        {
          filename: `expiry-report-${Date.now()}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    res.json({ success: true, message: "Expiry report sent to you ✅" });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
