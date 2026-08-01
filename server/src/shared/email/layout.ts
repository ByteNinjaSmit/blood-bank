import { env } from '@/core/config/env';

// ─── Brand tokens ────────────────────────────────────────────────────────────
const C = {
  red: '#b91c1c',
  redDark: '#991b1b',
  redLight: '#fee2e2',
  white: '#ffffff',
  zinc50: '#fafafa',
  zinc100: '#f4f4f5',
  zinc200: '#e4e4e7',
  zinc500: '#71717a',
  zinc700: '#3f3f46',
  zinc900: '#18181b',
  amber: '#d97706',
  amberLight: '#fef3c7',
  green: '#15803d',
  greenLight: '#dcfce7',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function infoRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:7px 12px 7px 0;color:${C.zinc500};font-size:13px;white-space:nowrap;vertical-align:top;">${label}</td>
      <td style="padding:7px 0;color:${C.zinc900};font-size:13px;font-weight:600;word-break:break-word;">${escHtml(value)}</td>
    </tr>`;
}

export function infoTable(rows: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
      style="border:1px solid ${C.zinc200};border-radius:8px;margin:16px 0;border-collapse:collapse;overflow:hidden;">
      <tbody style="background:${C.zinc50};">
        ${rows}
      </tbody>
    </table>`;
}

export function ctaButton(label: string, href: string): string {
  return `
    <a href="${href}"
      style="display:inline-block;background:${C.red};color:${C.white};text-decoration:none;
             padding:11px 24px;border-radius:8px;font-size:14px;font-weight:700;
             letter-spacing:0.3px;margin:8px 0;">
      ${label}
    </a>`;
}

export function alertBanner(
  message: string,
  level: 'critical' | 'warning' | 'info' = 'info',
): string {
  const colors = {
    critical: { bg: C.redLight, border: C.red, text: C.redDark, icon: '🔴' },
    warning: { bg: C.amberLight, border: C.amber, text: '#92400e', icon: '⚠️' },
    info: { bg: C.greenLight, border: C.green, text: '#14532d', icon: 'ℹ️' },
  };
  const c = colors[level];
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
      style="background:${c.bg};border-left:4px solid ${c.border};border-radius:6px;margin:16px 0;">
      <tr><td style="padding:12px 16px;color:${c.text};font-size:13px;">
        ${c.icon}&nbsp;&nbsp;<strong>${message}</strong>
      </td></tr>
    </table>`;
}

export function divider(): string {
  return `<hr style="border:none;border-top:1px solid ${C.zinc200};margin:20px 0;" />`;
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Main layout ─────────────────────────────────────────────────────────────
export interface LayoutOptions {
  title: string;
  bodyHtml: string;
  preheader?: string;
  /** Shown as a subtitle beneath the main title */
  subtitle?: string;
  /** 'critical' adds a red accent strip above the header */
  urgency?: 'critical' | 'normal';
}

export function renderLayout({
  title,
  bodyHtml,
  preheader,
  subtitle,
  urgency,
}: LayoutOptions): string {
  const now = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const bankName = env.BANK_NAME || 'Sanjivani Blood Bank';
  const bankAddress = env.BANK_ADDRESS || '';
  const bankPhone = env.BANK_PHONE || '';
  const bankLicense = env.BANK_LICENSE || '';
  const bankWebsite = env.BANK_WEBSITE || '';

  const urgencyStrip =
    urgency === 'critical'
      ? `<tr><td style="background:${C.redDark};padding:6px 28px;">
         <span style="color:${C.white};font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">⚠ URGENT — IMMEDIATE ACTION REQUIRED</span>
       </td></tr>`
      : '';

  const subtitleHtml = subtitle
    ? `<p style="margin:4px 0 0;font-size:14px;color:${C.zinc500};">${subtitle}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escHtml(title)}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:${C.zinc100};font-family:Arial,Helvetica,sans-serif;color:${C.zinc900};-webkit-font-smoothing:antialiased;">

  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>` : ''}

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.zinc100};padding:28px 16px;">
    <tr><td align="center">

      <!-- Container -->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0"
        style="background:${C.white};border-radius:12px;overflow:hidden;box-shadow:0 1px 6px rgba(0,0,0,0.08);">

        <!-- Urgency strip (critical only) -->
        ${urgencyStrip}

        <!-- Header -->
        <tr>
          <td style="background:${C.red};padding:24px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0;color:${C.white};font-size:20px;font-weight:700;letter-spacing:-0.3px;">${escHtml(bankName)}</p>
                  <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:11px;letter-spacing:0.8px;text-transform:uppercase;">Blood Bank Management System</p>
                </td>
                <td align="right" style="vertical-align:middle;">
                  <span style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:50%;width:44px;height:44px;text-align:center;line-height:44px;font-size:22px;">🩸</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Title bar -->
        <tr>
          <td style="background:${C.zinc50};padding:18px 28px;border-bottom:1px solid ${C.zinc200};">
            <h1 style="margin:0;font-size:18px;font-weight:700;color:${C.zinc900};line-height:1.3;">${escHtml(title)}</h1>
            ${subtitleHtml}
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:24px 28px;font-size:14px;line-height:1.6;color:${C.zinc700};">
            ${bodyHtml}
          </td>
        </tr>

        <!-- Timestamp bar -->
        <tr>
          <td style="padding:10px 28px;background:${C.zinc50};border-top:1px solid ${C.zinc200};">
            <p style="margin:0;font-size:11px;color:${C.zinc500};">Sent: ${now} IST</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 28px;background:${C.zinc100};border-top:1px solid ${C.zinc200};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:${C.zinc700};">${escHtml(bankName)}</p>
                  ${bankAddress ? `<p style="margin:0 0 2px;font-size:11px;color:${C.zinc500};">${escHtml(bankAddress)}</p>` : ''}
                  ${bankPhone ? `<p style="margin:0 0 2px;font-size:11px;color:${C.zinc500};">📞 ${escHtml(bankPhone)}</p>` : ''}
                  ${bankLicense ? `<p style="margin:0 0 2px;font-size:11px;color:${C.zinc500};">Licence: ${escHtml(bankLicense)}</p>` : ''}
                  ${bankWebsite ? `<p style="margin:0;font-size:11px;color:${C.zinc500};">🌐 ${escHtml(bankWebsite)}</p>` : ''}
                </td>
                <td align="right" valign="top">
                  <p style="margin:0;font-size:10px;color:${C.zinc500};text-align:right;">Automated message<br/>Do not reply to this email</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
      <!-- /Container -->

      <!-- Below-card disclaimer -->
      <p style="margin:16px 0 0;font-size:11px;color:${C.zinc500};text-align:center;">
        This message contains confidential patient and blood bank data. If received in error, delete it immediately.
      </p>

    </td></tr>
  </table>
</body>
</html>`;
}
