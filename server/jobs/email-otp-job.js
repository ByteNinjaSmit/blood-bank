// jobs/email-otp-job.js
const logger = require('../utils/logger');
const { sendEmail } = require('../services/email-service');

function brandEmailHtml({ code, expiresMinutes = 5 }) {
  const digits = String(code).padStart(6, '0').slice(0, 6).split('');
  return `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f6f7fb" style="margin:0;padding:24px 0;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="width:560px;max-width:560px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
          <tr>
            <td align="left" style="background:#891b1b;background:linear-gradient(135deg,#991b1b,#7f1d1d);padding:20px 24px;color:#ffffff;">
              <div style="font-size:18px;font-weight:700;letter-spacing:.2px;line-height:1.2;">SANJIVANI BLOOD BANK</div>
              <div style="font-size:12px;opacity:.9;line-height:1.4;">Secure access verification</div>
            </td>
          </tr>
          <tr>
            <td align="left" style="padding:24px;color:#111827;">
              <div style="font-size:20px;font-weight:700;margin:0 0 6px 0;line-height:1.3;">Your One-Time Passcode</div>
              <div style="font-size:14px;color:#4b5563;line-height:1.6;">Use this code to complete your sign in. This code expires in ${expiresMinutes} minutes.</div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:8px 24px 4px 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="border-collapse:separate;border-spacing:8px 0;">
                <tr>
                  ${digits.map(d => `
                    <td align="center" valign="middle" width="44" height="52" style="width:44px;height:52px;border:1px solid #e5e7eb;border-radius:10px;background:#f9fafb;">
                      <div style="font-size:20px;font-weight:700;color:#111827;line-height:52px;">${d}</div>
                    </td>
                  `).join('')}
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="left" style="padding:12px 24px 20px 24px;color:#6b7280;font-size:12px;line-height:18px;">
              If you did not request this code, you can safely ignore this email.<br/>
              For security, never share this code with anyone.
            </td>
          </tr>
          <tr>
            <td align="left" style="background:#f9fafb;padding:14px 24px;color:#6b7280;font-size:12px;border-top:1px solid #e5e7eb;">
              © ${new Date().getFullYear()} Sanjivani Blood Bank. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

async function processEmailOtpJob(job) {
  const { email, code, txnId, expiresInSeconds } = job.data || {};
  logger.info({ jobId: job.id, email, txnId }, '[EmailOTP] Job started');
  try {
    if (!email || !code || !txnId) {
      throw new Error('Missing required fields for OTP email');
    }
    const subject = 'Your One-Time Passcode (5-minute expiry)';
    const text = `Your OTP code is ${code}\n\nThis code will expire in 5 minutes. If you did not request this, please ignore.`;
    const html = brandEmailHtml({ code, expiresMinutes: Math.ceil((expiresInSeconds || 300) / 60) });
    await sendEmail(email, subject, text, undefined, html);
    logger.info({ jobId: job.id, email, txnId }, '[EmailOTP] Email sent');
    return { ok: true };
  } catch (error) {
    logger.error({ jobId: job.id, email, txnId, error: error.message }, '[EmailOTP] Job failed');
    throw error;
  }
}

module.exports = { processEmailOtpJob };
