// Shared HTML email shell. Keeps every template on-brand and inlines
// minimal styles (email clients strip <style>, so inline only).

export interface LayoutOptions {
  title: string;
  bodyHtml: string;
  preheader?: string;
}

const BRAND = '#b91c1c'; // blood red

export function renderLayout({ title, bodyHtml, preheader }: LayoutOptions): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
    ${preheader ? `<span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>` : ''}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr><td style="background:${BRAND};padding:20px 28px;">
            <span style="color:#ffffff;font-size:18px;font-weight:bold;">Sanjivani Blood Bank</span>
          </td></tr>
          <tr><td style="padding:28px;">
            <h1 style="margin:0 0 16px;font-size:20px;color:#18181b;">${title}</h1>
            ${bodyHtml}
          </td></tr>
          <tr><td style="padding:18px 28px;background:#fafafa;border-top:1px solid #e4e4e7;">
            <p style="margin:0;font-size:12px;color:#71717a;">
              Internal Blood Bank Management System. This is an automated message — do not reply.
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export function button(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:bold;">${label}</a>`;
}

export function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;color:#71717a;font-size:13px;width:40%;">${label}</td>
    <td style="padding:6px 0;color:#18181b;font-size:13px;font-weight:bold;">${value}</td>
  </tr>`;
}
