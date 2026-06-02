// Email templates. Each returns { subject, html, text }. Pure
// functions of their payload — no IO. One per NotificationType.

import { renderLayout, infoRow } from './layout';
import type { NotificationType } from '@/shared/enums';

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export interface TemplatePayloads {
  DONOR_WELCOME: { donorName: string; donorId: string };
  DONATION_THANK_YOU: { donorName: string; donationId: string; collectedAt: string };
  TTI_REACTIVE_ALERT: { donationId: string; reactiveTests: string[]; counsellorEmail: string };
  NEAR_EXPIRY_ALERT: { count: number; reportDate: string; details: string };
  REQUISITION_ISSUED: {
    requisitionId: string;
    hospitalName: string;
    unitIds: string[];
    patientName: string;
  };
  ADVERSE_REACTION_ACK: {
    reactionId: string;
    category: string;
    severity: string;
    transfusionId: string;
  };
  LOOKBACK_RECALL: {
    donationId: string;
    affectedUnitIds: string[];
    recipientCount: number;
  };
  LOGIN_OTP: { code: string; expiresInSeconds: number };
  REGISTER_OTP: { code: string; expiresInSeconds: number };
}

function table(rows: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0;">${rows}</table>`;
}

const RENDERERS: {
  [K in NotificationType]: (p: TemplatePayloads[K]) => RenderedEmail;
} = {
  DONOR_WELCOME: (p) => ({
    subject: 'Welcome to Sanjivani Blood Bank',
    html: renderLayout({
      title: `Welcome, ${p.donorName}`,
      preheader: 'Thank you for registering as a donor.',
      bodyHtml: `<p>Your donor record has been created.</p>${table(
        infoRow('Donor ID', p.donorId),
      )}<p>Thank you for joining our community of life-savers.</p>`,
    }),
    text: `Welcome ${p.donorName}. Donor ID: ${p.donorId}.`,
  }),

  DONATION_THANK_YOU: (p) => ({
    subject: 'Thank you for your donation',
    html: renderLayout({
      title: `Thank you, ${p.donorName}`,
      bodyHtml: `<p>Your donation has been recorded. It will help save lives.</p>${table(
        infoRow('Donation ID', p.donationId) + infoRow('Collected', p.collectedAt),
      )}`,
    }),
    text: `Thank you ${p.donorName}. Donation ${p.donationId} on ${p.collectedAt}.`,
  }),

  TTI_REACTIVE_ALERT: (p) => ({
    subject: `[ACTION] TTI reactive — donation ${p.donationId}`,
    html: renderLayout({
      title: 'TTI Reactive Result — Counsellor Action Required',
      preheader: 'A donation tested reactive and requires lookback + counselling.',
      bodyHtml: `<p>A donation has tested <strong style="color:#b91c1c;">REACTIVE</strong>. Units discarded, donor permanently deferred. Initiate donor counselling and lookback.</p>${table(
        infoRow('Donation ID', p.donationId) +
          infoRow('Reactive tests', p.reactiveTests.join(', ')),
      )}`,
    }),
    text: `TTI REACTIVE donation ${p.donationId}: ${p.reactiveTests.join(', ')}. Lookback + counselling required.`,
  }),

  NEAR_EXPIRY_ALERT: (p) => ({
    subject: `Near-expiry stock alert — ${p.count} unit(s)`,
    html: renderLayout({
      title: 'Units Approaching Expiry',
      bodyHtml: `<p><strong>${p.count}</strong> unit(s) expire soon (as of ${p.reportDate}). Prioritise for issue (FEFO).</p><pre style="background:#fafafa;padding:12px;border-radius:8px;font-size:12px;">${p.details}</pre>`,
    }),
    text: `${p.count} units near expiry as of ${p.reportDate}.\n${p.details}`,
  }),

  REQUISITION_ISSUED: (p) => ({
    subject: `Units issued — requisition ${p.requisitionId}`,
    html: renderLayout({
      title: 'Blood Units Issued',
      bodyHtml: `<p>Units have been issued against the requisition below.</p>${table(
        infoRow('Requisition', p.requisitionId) +
          infoRow('Hospital', p.hospitalName) +
          infoRow('Patient', p.patientName) +
          infoRow('Units', p.unitIds.join(', ')),
      )}<p>Maintain cold chain. Bedside two-person check before transfusion.</p>`,
    }),
    text: `Issued units ${p.unitIds.join(', ')} for requisition ${p.requisitionId} (${p.hospitalName}, patient ${p.patientName}).`,
  }),

  ADVERSE_REACTION_ACK: (p) => ({
    subject: `Adverse reaction logged — ${p.reactionId}`,
    html: renderLayout({
      title: 'Adverse Transfusion Reaction Recorded',
      bodyHtml: `<p>A reaction has been recorded and forwarded to haemovigilance.</p>${table(
        infoRow('Reaction ID', p.reactionId) +
          infoRow('Category', p.category) +
          infoRow('Severity', p.severity) +
          infoRow('Transfusion', p.transfusionId),
      )}`,
    }),
    text: `Adverse reaction ${p.reactionId} (${p.category}, ${p.severity}) for transfusion ${p.transfusionId}.`,
  }),

  LOOKBACK_RECALL: (p) => ({
    subject: `[URGENT] Lookback recall — donation ${p.donationId}`,
    html: renderLayout({
      title: 'Lookback Recall Initiated',
      preheader: 'A donor turned reactive — trace and notify recipients.',
      bodyHtml: `<p style="color:#b91c1c;"><strong>Recall in progress.</strong></p>${table(
        infoRow('Source donation', p.donationId) +
          infoRow('Affected units', p.affectedUnitIds.join(', ') || 'none in stock') +
          infoRow('Recipients to notify', String(p.recipientCount)),
      )}`,
    }),
    text: `Lookback recall donation ${p.donationId}: ${p.affectedUnitIds.length} units, ${p.recipientCount} recipients.`,
  }),

  LOGIN_OTP: (p) => ({
    subject: `Your login code: ${p.code}`,
    html: renderLayout({
      title: 'Login Verification Code',
      preheader: 'Use this one-time code to finish signing in.',
      bodyHtml: `<p>Enter this code to complete your login:</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#b91c1c;margin:16px 0;">${p.code}</p>
        <p style="color:#71717a;font-size:13px;">Expires in ${Math.round(p.expiresInSeconds / 60)} minute(s). If you didn't request this, ignore it.</p>`,
    }),
    text: `Login code: ${p.code}. Expires in ${Math.round(p.expiresInSeconds / 60)} min.`,
  }),

  REGISTER_OTP: (p) => ({
    subject: `Confirm your registration: ${p.code}`,
    html: renderLayout({
      title: 'Registration Verification Code',
      bodyHtml: `<p>Enter this code to confirm your account:</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#b91c1c;margin:16px 0;">${p.code}</p>
        <p style="color:#71717a;font-size:13px;">Expires in ${Math.round(p.expiresInSeconds / 60)} minute(s).</p>`,
    }),
    text: `Registration code: ${p.code}. Expires in ${Math.round(p.expiresInSeconds / 60)} min.`,
  }),
};

export function renderEmail<K extends NotificationType>(
  type: K,
  payload: TemplatePayloads[K],
): RenderedEmail {
  return RENDERERS[type](payload);
}
