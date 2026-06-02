// ./config/mailConfig.js
const nodemailer = require('nodemailer');

const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
const port = Number(process.env.EMAIL_PORT || 465);
const secure = process.env.EMAIL_SECURE ? process.env.EMAIL_SECURE === 'true' : port === 465;

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
      console.log('Email configuration error:', error);
    } else {
      console.log('Email server is ready to take our messages');
    }
  });
} else {
  console.log('Email credentials not configured - skipping verification');
}

module.exports = transporter;
