import { renderLayout, infoTable, infoRow, alertBanner, ctaButton, divider } from './layout';
import type { NotificationType } from '@/shared/enums';

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export interface TemplatePayloads {
  DONOR_WELCOME: {
    donorName: string;
    donorId: string;
    bloodGroup: string;
    rh: string;
    registeredBy?: string;
  };
  DONATION_THANK_YOU: {
    donorName: string;
    donorId: string;
    donationId: string;
    collectedAt: string;
    componentCount: number;
    campName?: string;
    phlebotomist?: string;
  };
  DONOR_DEFERRED: {
    donorName: string;
    donorId: string;
    deferralType: 'TEMPORARY' | 'PERMANENT';
    reason: string;
    deferredUntil?: string;
    deferredBy: string;
  };
  DONOR_BIRTHDAY: {
    donorName: string;
    donorId: string;
    bloodGroup: string;
    rh: string;
    totalDonations: number;
  };
  TTI_REACTIVE_ALERT: {
    donationId: string;
    reactiveTests: string[];
    counsellorEmail: string;
    donorId?: string;
    donorName?: string;
    collectionDate?: string;
    affectedUnitCount?: number;
  };
  NEAR_EXPIRY_ALERT: {
    count: number;
    reportDate: string;
    details: string;
    daysThreshold: number;
  };
  DISCARD_REPORT: {
    reportDate: string;
    totalDiscarded: number;
    byReason: Array<{ reason: string; count: number }>;
    details: string;
  };
  MONTHLY_MIS_REPORT: {
    month: string;
    totalDonations: number;
    totalUnitsIssued: number;
    totalDiscarded: number;
    totalExpired: number;
    reactiveCount: number;
    campCount: number;
    newDonors: number;
  };
  REQUISITION_ISSUED: {
    requisitionId: string;
    hospitalName: string;
    unitIds: string[];
    patientName: string;
    bloodGroup: string;
    rh: string;
    componentType: string;
    issuedBy: string;
    issuedAt: string;
  };
  ADVERSE_REACTION_ACK: {
    reactionId: string;
    category: string;
    severity: string;
    transfusionId: string;
    donationId?: string;
    reportedBy?: string;
    reportedAt?: string;
  };
  LOOKBACK_RECALL: {
    donationId: string;
    affectedUnitIds: string[];
    recipientCount: number;
    donorId?: string;
    donorName?: string;
    reactiveTests?: string[];
    initiatedBy?: string;
    initiatedAt?: string;
  };
  LOGIN_OTP: { code: string; expiresInSeconds: number; userEmail?: string };
  REGISTER_OTP: { code: string; expiresInSeconds: number; userName?: string };
}

// ─── Renderers ───────────────────────────────────────────────────────────────

const RENDERERS: { [K in NotificationType]: (p: TemplatePayloads[K]) => RenderedEmail } = {
  DONOR_WELCOME: (p) => ({
    subject: `Welcome to our donor family — ${p.donorName} [${p.donorId}]`,
    html: renderLayout({
      title: `Welcome, ${p.donorName}!`,
      subtitle: 'Your donor registration is confirmed.',
      preheader: `Donor ID ${p.donorId} — ${p.bloodGroup}${p.rh} — Thank you for choosing to save lives.`,
      bodyHtml: `
        <p>We are delighted to welcome you to <strong>Sanjivani Blood Bank</strong> as a registered blood donor.
        Your generosity has the power to save up to three lives with each donation.</p>
        ${infoTable(
          infoRow('Donor ID', p.donorId) +
            infoRow('Blood Group', `${p.bloodGroup} ${p.rh}`) +
            (p.registeredBy ? infoRow('Registered by', p.registeredBy) : ''),
        )}
        <p>Please keep this Donor ID handy — you will need it for future donations and appointments.
        Present a valid photo ID at each donation visit.</p>
        ${divider()}
        <p style="font-size:13px;color:#71717a;">
          <strong>Eligibility reminder:</strong> You may donate whole blood every 90 days.
          Ensure you are well-rested, well-hydrated, and have eaten a light meal before donation.
        </p>`,
    }),
    text: `Welcome ${p.donorName}!\n\nDonor ID: ${p.donorId}\nBlood Group: ${p.bloodGroup} ${p.rh}\n\nThank you for registering with Sanjivani Blood Bank. Your donor ID is required for future donations. Please present a valid photo ID at each visit.`,
  }),

  DONATION_THANK_YOU: (p) => ({
    subject: `Donation received — ${p.donationId} | Thank you, ${p.donorName}`,
    html: renderLayout({
      title: `Thank you, ${p.donorName}!`,
      subtitle: 'Your donation has been received and recorded.',
      preheader: `Donation ${p.donationId} — ${p.componentCount} unit(s) entered quarantine for testing.`,
      bodyHtml: `
        <p>Your blood donation has been successfully collected and recorded. Your contribution is now entering
        the testing and processing pipeline. Once cleared, it will be made available to patients in need.</p>
        ${infoTable(
          infoRow('Donation ID', p.donationId) +
            infoRow('Donor ID', p.donorId) +
            infoRow('Collected on', p.collectedAt) +
            infoRow('Units derived', String(p.componentCount)) +
            (p.campName ? infoRow('Camp', p.campName) : '') +
            (p.phlebotomist ? infoRow('Phlebotomist', p.phlebotomist) : ''),
        )}
        ${alertBanner('Your units are now in TTI quarantine. Results will be processed within 48–72 hours.', 'info')}
        <p>Post-donation care reminders:</p>
        <ul style="padding-left:20px;font-size:13px;line-height:1.8;">
          <li>Drink plenty of fluids for the next 24 hours.</li>
          <li>Avoid strenuous physical activity for 12 hours.</li>
          <li>Keep the bandage on for at least 2 hours.</li>
          <li>You may donate again after <strong>90 days</strong>.</li>
        </ul>`,
    }),
    text: `Dear ${p.donorName},\n\nThank you for your donation.\n\nDonation ID: ${p.donationId}\nCollected: ${p.collectedAt}\nUnits: ${p.componentCount}${p.campName ? `\nCamp: ${p.campName}` : ''}\n\nYour units are in TTI quarantine. Stay hydrated and rest for 12 hours. Next eligible donation date: 90 days from today.`,
  }),

  DONOR_DEFERRED: (p) => ({
    subject: `Deferral notice — ${p.donorName} [${p.donorId}]`,
    html: renderLayout({
      title: 'Donor Deferral Notice',
      subtitle: `${p.deferralType === 'PERMANENT' ? 'Permanent' : 'Temporary'} deferral recorded.`,
      preheader: `Donor ${p.donorId} has been deferred — ${p.reason}.`,
      urgency: p.deferralType === 'PERMANENT' ? 'critical' : 'normal',
      bodyHtml: `
        ${
          p.deferralType === 'PERMANENT'
            ? alertBanner(
                'This donor has been permanently deferred and cannot donate in future.',
                'critical',
              )
            : alertBanner(
                `Temporary deferral ${p.deferredUntil ? 'until ' + p.deferredUntil : '— duration as specified'}. Donor may donate after the deferral period ends.`,
                'warning',
              )
        }
        ${infoTable(
          infoRow('Donor Name', p.donorName) +
            infoRow('Donor ID', p.donorId) +
            infoRow('Deferral Type', p.deferralType) +
            infoRow('Reason', p.reason) +
            (p.deferredUntil ? infoRow('Deferred Until', p.deferredUntil) : '') +
            infoRow('Deferred by', p.deferredBy),
        )}
        <p>The donor's eligibility status has been updated in the system. Staff at the reception desk will
        be notified automatically upon the donor's next check-in.</p>
        ${
          p.deferralType === 'PERMANENT'
            ? `<p>Arrange donor counselling as per NBTC guidelines. Do not disclose the specific test results without consent.</p>`
            : ''
        }`,
    }),
    text: `Deferral Notice\n\nDonor: ${p.donorName} (${p.donorId})\nType: ${p.deferralType}\nReason: ${p.reason}${p.deferredUntil ? `\nUntil: ${p.deferredUntil}` : ''}\nBy: ${p.deferredBy}`,
  }),

  DONOR_BIRTHDAY: (p) => ({
    subject: `Happy Birthday, ${p.donorName}! 🩸 Sanjivani Blood Bank`,
    html: renderLayout({
      title: `Happy Birthday, ${p.donorName}! 🎂`,
      subtitle: 'Wishing you health, happiness, and many more donations.',
      preheader: 'A special message from the Sanjivani Blood Bank family.',
      bodyHtml: `
        <p>On behalf of the entire team at <strong>Sanjivani Blood Bank</strong>, we wish you a very
        <strong>Happy Birthday!</strong></p>
        <p>Your generosity has already made a difference — and we are grateful for your continued support.</p>
        ${infoTable(
          infoRow('Donor ID', p.donorId) +
            infoRow('Blood Group', `${p.bloodGroup} ${p.rh}`) +
            infoRow('Total donations', String(p.totalDonations)),
        )}
        <p>
          ${
            p.totalDonations === 0
              ? 'You are registered but have not yet donated. <strong>This birthday could be the day you save a life!</strong>'
              : `Your <strong>${p.totalDonations}</strong> donation${p.totalDonations > 1 ? 's' : ''} may have helped up to <strong>${p.totalDonations * 3}</strong> patients. Thank you for being a hero!`
          }
        </p>
        ${divider()}
        <p style="font-size:13px;color:#71717a;">Remember, you may donate every 90 days. Schedule your next appointment at the blood bank today.</p>`,
    }),
    text: `Happy Birthday, ${p.donorName}!\n\nWishing you a wonderful birthday from Sanjivani Blood Bank.\n\nDonor ID: ${p.donorId}\nBlood Group: ${p.bloodGroup} ${p.rh}\nTotal donations: ${p.totalDonations}\n\nThank you for your support. You can donate every 90 days.`,
  }),

  TTI_REACTIVE_ALERT: (p) => ({
    subject: `[URGENT] TTI Reactive — Donation ${p.donationId} — Immediate Action Required`,
    html: renderLayout({
      title: 'TTI Reactive Result Detected',
      subtitle: 'Counselling, lookback, and unit quarantine required immediately.',
      preheader: `Donation ${p.donationId} tested REACTIVE.${p.affectedUnitCount ? ` ${p.affectedUnitCount} unit(s) discarded.` : ''} Lookback initiated.`,
      urgency: 'critical',
      bodyHtml: `
        ${alertBanner(`Donation ${p.donationId} has returned a REACTIVE TTI result. All derived units have been placed under quarantine/discarded. Lookback protocol must be initiated.`, 'critical')}
        ${infoTable(
          infoRow('Donation ID', p.donationId) +
            (p.donorId ? infoRow('Donor ID', p.donorId) : '') +
            (p.donorName ? infoRow('Donor Name', p.donorName) : '') +
            (p.collectionDate ? infoRow('Collection Date', p.collectionDate) : '') +
            infoRow('Reactive Tests', p.reactiveTests.join(', ')) +
            (p.affectedUnitCount != null
              ? infoRow('Units Affected', String(p.affectedUnitCount))
              : '') +
            infoRow('Counsellor Email', p.counsellorEmail),
        )}
        <p><strong>Required Actions:</strong></p>
        <ol style="padding-left:20px;font-size:13px;line-height:2;">
          <li>Permanently defer the donor in the system (if not already done).</li>
          <li>Discard all derived units from this donation.</li>
          <li>Initiate lookback for any previously issued units from this donor.</li>
          <li>Arrange donor counselling per NBTC Guideline 5.6.</li>
          <li>Submit haemovigilance report within 72 hours.</li>
        </ol>`,
    }),
    text: `[URGENT] TTI Reactive\n\nDonation: ${p.donationId}\nDonor: ${p.donorName} (${p.donorId})\nReactive tests: ${p.reactiveTests.join(', ')}\nUnits affected: ${p.affectedUnitCount}\n\nActions:\n1. Permanently defer donor\n2. Discard all derived units\n3. Initiate lookback\n4. Arrange counselling\n5. Submit haemovigilance report`,
  }),

  NEAR_EXPIRY_ALERT: (p) => ({
    subject: `Stock Alert: ${p.count} unit(s) expiring within ${p.daysThreshold} day(s) — ${p.reportDate}`,
    html: renderLayout({
      title: `Near-Expiry Stock Alert`,
      subtitle: `${p.count} unit(s) expiring within ${p.daysThreshold} day(s) as of ${p.reportDate}.`,
      preheader: `${p.count} blood unit(s) are approaching expiry. Prioritise for issue (FEFO).`,
      urgency: p.count > 20 ? 'critical' : 'normal',
      bodyHtml: `
        ${alertBanner(`${p.count} unit(s) are approaching expiry. Issue using FEFO (First Expiry First Out) to prevent wastage.`, p.count > 20 ? 'critical' : 'warning')}
        ${infoTable(
          infoRow('Report Date', p.reportDate) +
            infoRow('Units Near Expiry', String(p.count)) +
            infoRow('Threshold', `${p.daysThreshold} day(s)`),
        )}
        <p><strong>Unit Detail (FEFO order):</strong></p>
        <pre style="background:#f4f4f5;padding:14px 16px;border-radius:8px;font-size:12px;font-family:monospace;overflow-x:auto;white-space:pre-wrap;word-break:break-all;">${p.details}</pre>
        <p style="font-size:13px;">Please coordinate with the Issue Counter and referring hospitals to prioritise these units. A detailed PDF report is attached.</p>`,
    }),
    text: `Near-Expiry Alert — ${p.reportDate}\n\n${p.count} unit(s) expiring within ${p.daysThreshold} day(s).\n\n${p.details}`,
  }),

  DISCARD_REPORT: (p) => ({
    subject: `Discard Report — ${p.reportDate} | ${p.totalDiscarded} unit(s) discarded`,
    html: renderLayout({
      title: 'Daily Discard Report',
      subtitle: `${p.totalDiscarded} unit(s) discarded — ${p.reportDate}`,
      preheader: `${p.totalDiscarded} blood units discarded. Full breakdown attached.`,
      bodyHtml: `
        ${infoTable(infoRow('Report Date', p.reportDate) + infoRow('Total Discarded', String(p.totalDiscarded)))}
        <p><strong>Breakdown by Reason:</strong></p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
          style="border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;margin:12px 0;">
          <thead>
            <tr style="background:#f4f4f5;">
              <th style="padding:10px 14px;text-align:left;font-size:12px;color:#71717a;font-weight:700;">Reason</th>
              <th style="padding:10px 14px;text-align:right;font-size:12px;color:#71717a;font-weight:700;">Count</th>
            </tr>
          </thead>
          <tbody>
            ${p.byReason
              .map(
                (r, i) => `
              <tr style="background:${i % 2 === 0 ? '#ffffff' : '#fafafa'};">
                <td style="padding:9px 14px;font-size:13px;">${r.reason}</td>
                <td style="padding:9px 14px;font-size:13px;font-weight:700;text-align:right;">${r.count}</td>
              </tr>`,
              )
              .join('')}
          </tbody>
        </table>
        <p style="font-size:13px;">Full unit-level detail is in the attached PDF report. Please review and archive as per your QC procedure.</p>`,
    }),
    text: `Discard Report — ${p.reportDate}\nTotal discarded: ${p.totalDiscarded}\n\nBreakdown:\n${p.byReason.map((r) => `${r.reason}: ${r.count}`).join('\n')}\n\n${p.details}`,
  }),

  MONTHLY_MIS_REPORT: (p) => ({
    subject: `Monthly MIS Report — ${p.month} | Sanjivani Blood Bank`,
    html: renderLayout({
      title: `Monthly Management Report`,
      subtitle: `${p.month}`,
      preheader: `${p.totalDonations} donations, ${p.totalUnitsIssued} units issued — ${p.month}.`,
      bodyHtml: `
        <p>Please find the monthly summary for <strong>${p.month}</strong> below. A detailed PDF report is attached for records.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
          style="border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;margin:16px 0;">
          <thead>
            <tr style="background:#b91c1c;">
              <th colspan="2" style="padding:12px 16px;text-align:left;font-size:13px;color:#ffffff;font-weight:700;">Key Performance Indicators</th>
            </tr>
          </thead>
          <tbody>
            ${[
              ['Total Donations', p.totalDonations],
              ['Units Issued', p.totalUnitsIssued],
              ['Units Discarded', p.totalDiscarded],
              ['Units Expired', p.totalExpired],
              ['Reactive TTI Results', p.reactiveCount],
              ['Donation Camps Held', p.campCount],
              ['New Donors Registered', p.newDonors],
            ]
              .map(
                ([label, val], i) => `
              <tr style="background:${i % 2 === 0 ? '#ffffff' : '#fafafa'};">
                <td style="padding:10px 16px;font-size:13px;color:#3f3f46;">${label}</td>
                <td style="padding:10px 16px;font-size:14px;font-weight:700;text-align:right;color:#18181b;">${val}</td>
              </tr>`,
              )
              .join('')}
          </tbody>
        </table>
        <p style="font-size:13px;color:#71717a;">This report is generated automatically at month-end. Please forward to management and retain for statutory compliance.</p>`,
    }),
    text: `Monthly MIS Report — ${p.month}\n\nDonations: ${p.totalDonations}\nUnits Issued: ${p.totalUnitsIssued}\nDiscarded: ${p.totalDiscarded}\nExpired: ${p.totalExpired}\nReactive TTI: ${p.reactiveCount}\nCamps: ${p.campCount}\nNew Donors: ${p.newDonors}`,
  }),

  REQUISITION_ISSUED: (p) => ({
    subject: `Units Issued — Req. ${p.requisitionId} | ${p.hospitalName}`,
    html: renderLayout({
      title: 'Blood Units Issued',
      subtitle: `Requisition ${p.requisitionId} — ${p.hospitalName}`,
      preheader: `${p.unitIds.length} unit(s) of ${p.componentType} issued to ${p.hospitalName} for ${p.patientName}.`,
      bodyHtml: `
        <p>The following blood units have been issued. Please maintain cold chain and perform
        <strong>two-person bedside identity check</strong> before transfusion.</p>
        ${infoTable(
          infoRow('Requisition ID', p.requisitionId) +
            infoRow('Hospital', p.hospitalName) +
            infoRow('Patient Name', p.patientName) +
            infoRow('Blood Group', `${p.bloodGroup} ${p.rh}`) +
            infoRow('Component', p.componentType) +
            infoRow('Units Issued', `${p.unitIds.length} unit(s)`) +
            infoRow('Unit IDs', p.unitIds.join(', ')) +
            infoRow('Issued by', p.issuedBy) +
            infoRow('Issued at', p.issuedAt),
        )}
        ${alertBanner('Verify ABO/Rh compatibility at the bedside before initiating transfusion. Follow the two-person check protocol.', 'warning')}
        <p style="font-size:13px;">Cold chain must be maintained. Transfuse within 30 minutes of removal from controlled storage (or per component guidelines). Report any adverse reactions immediately.</p>`,
    }),
    text: `Units Issued\n\nRequisition: ${p.requisitionId}\nHospital: ${p.hospitalName}\nPatient: ${p.patientName}\nBlood Group: ${p.bloodGroup} ${p.rh}\nComponent: ${p.componentType}\nUnit IDs: ${p.unitIds.join(', ')}\nIssued by: ${p.issuedBy}\nIssued at: ${p.issuedAt}\n\nMaintain cold chain. Perform bedside check before transfusion.`,
  }),

  ADVERSE_REACTION_ACK: (p) => ({
    subject: `Adverse Reaction Recorded — ${p.reactionId} | ${p.category} (${p.severity})`,
    html: renderLayout({
      title: 'Adverse Transfusion Reaction Recorded',
      subtitle: `${p.category} — ${p.severity}`,
      preheader: `Reaction ${p.reactionId} reported — ${p.category} grade ${p.severity}. Haemovigilance notified.`,
      urgency: p.severity === 'GRADE_3' || p.severity === 'GRADE_4' ? 'critical' : 'normal',
      bodyHtml: `
        ${
          p.severity === 'GRADE_4'
            ? alertBanner(
                'FATAL adverse reaction recorded. Immediate haemovigilance report to regulatory authority required.',
                'critical',
              )
            : p.severity === 'GRADE_3'
              ? alertBanner(
                  'Severe / life-threatening reaction. Escalate to Medical Officer and BBO immediately.',
                  'critical',
                )
              : alertBanner(
                  'This reaction has been logged and forwarded to the haemovigilance register.',
                  'info',
                )
        }
        ${infoTable(
          infoRow('Reaction ID', p.reactionId) +
            infoRow('Transfusion ID', p.transfusionId) +
            (p.donationId ? infoRow('Donation ID', p.donationId) : '') +
            infoRow('Category', p.category) +
            infoRow('Severity Grade', p.severity) +
            (p.reportedBy ? infoRow('Reported by', p.reportedBy) : '') +
            (p.reportedAt ? infoRow('Reported at', p.reportedAt) : ''),
        )}
        <p><strong>Follow-up actions:</strong></p>
        <ul style="padding-left:20px;font-size:13px;line-height:2;">
          <li>Stop transfusion if still in progress.</li>
          <li>Retain all bags and tubing for investigation.</li>
          <li>Send patient and donor samples to the lab.</li>
          <li>Complete ISBT haemovigilance form within 24 hours.</li>
          ${p.severity === 'GRADE_3' || p.severity === 'GRADE_4' ? '<li><strong>Submit regulatory incident report within 72 hours.</strong></li>' : ''}
        </ul>`,
    }),
    text: `Adverse Reaction — ${p.reactionId}\n\nCategory: ${p.category}\nSeverity: ${p.severity}\nTransfusion: ${p.transfusionId}\n${p.donationId ? `Donation: ${p.donationId}\n` : ''}${p.reportedBy ? `Reported by: ${p.reportedBy}${p.reportedAt ? ` at ${p.reportedAt}` : ''}\n` : ''}\nActions: Stop transfusion, retain bags, send samples, complete haemovigilance form.`,
  }),

  LOOKBACK_RECALL: (p) => ({
    subject: `[URGENT] Lookback Recall Initiated — Donation ${p.donationId}`,
    html: renderLayout({
      title: 'Lookback Recall — Immediate Trace Required',
      subtitle: `Source donation ${p.donationId} — reactive donor.`,
      preheader: `${p.affectedUnitIds.length} unit(s) from reactive donor require trace. ${p.recipientCount} recipient(s) to be notified.`,
      urgency: 'critical',
      bodyHtml: `
        ${alertBanner(`A previously collected donation has returned a reactive TTI result. All derived units must be traced and ${p.recipientCount} recipient(s) notified as per lookback protocol.`, 'critical')}
        ${infoTable(
          infoRow('Source Donation', p.donationId) +
            (p.donorId ? infoRow('Donor ID', p.donorId) : '') +
            (p.donorName ? infoRow('Donor Name', p.donorName) : '') +
            (p.reactiveTests?.length ? infoRow('Reactive Tests', p.reactiveTests.join(', ')) : '') +
            infoRow(
              'Affected Units',
              p.affectedUnitIds.length > 0
                ? p.affectedUnitIds.join(', ')
                : 'No units remaining in stock',
            ) +
            infoRow('Recipients to Notify', String(p.recipientCount)) +
            (p.initiatedBy ? infoRow('Initiated by', p.initiatedBy) : '') +
            (p.initiatedAt ? infoRow('Initiated at', p.initiatedAt) : ''),
        )}
        <p><strong>Lookback Protocol — Required Steps:</strong></p>
        <ol style="padding-left:20px;font-size:13px;line-height:2;">
          <li>Retrieve and quarantine all in-stock units derived from donation <strong>${p.donationId}</strong>.</li>
          <li>Identify all recipients who received units from this donor (previous donations).</li>
          <li>Notify treating physicians of each recipient.</li>
          <li>Arrange re-testing of recipients as per NBTC Lookback Guidelines.</li>
          <li>Document all actions in the lookback register.</li>
          <li>Report to statutory authority within the required timeframe.</li>
        </ol>`,
    }),
    text: `[URGENT] Lookback Recall\n\nSource Donation: ${p.donationId}\n${p.donorName ? `Donor: ${p.donorName}${p.donorId ? ` (${p.donorId})` : ''}\n` : ''}${p.reactiveTests?.length ? `Reactive: ${p.reactiveTests.join(', ')}\n` : ''}Affected units: ${p.affectedUnitIds.join(', ')}\nRecipients to notify: ${p.recipientCount}\n${p.initiatedAt ? `Initiated: ${p.initiatedAt}${p.initiatedBy ? ` by ${p.initiatedBy}` : ''}\n` : ''}\n\nSteps:\n1. Quarantine in-stock units\n2. Identify all recipients\n3. Notify treating physicians\n4. Arrange recipient re-testing\n5. Document in lookback register\n6. Report to statutory authority`,
  }),

  LOGIN_OTP: (p) => ({
    subject: `${p.code} — Your Sanjivani Blood Bank login code`,
    html: renderLayout({
      title: 'Login Verification Code',
      preheader: `Your one-time login code is ${p.code}. Expires in ${Math.round(p.expiresInSeconds / 60)} minute(s).`,
      bodyHtml: `
        <p>You requested a one-time code to sign in to the Blood Bank Management System.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
          <tr>
            <td align="center">
              <div style="display:inline-block;background:#fee2e2;border:2px dashed #b91c1c;border-radius:12px;padding:18px 36px;text-align:center;">
                <p style="margin:0 0 4px;font-size:11px;color:#991b1b;letter-spacing:1px;text-transform:uppercase;font-weight:700;">One-Time Code</p>
                <p style="margin:0;font-size:40px;font-weight:900;letter-spacing:10px;color:#b91c1c;font-family:monospace;">${p.code}</p>
              </div>
            </td>
          </tr>
        </table>
        <p style="text-align:center;font-size:13px;color:#71717a;">
          Expires in <strong>${Math.round(p.expiresInSeconds / 60)} minute(s)</strong>.
        </p>
        ${alertBanner('If you did not request this code, ignore this email and consider changing your password.', 'warning')}`,
    }),
    text: `Your Sanjivani Blood Bank login code: ${p.code}\n\nExpires in ${Math.round(p.expiresInSeconds / 60)} minute(s).\n\nIf you did not request this, ignore this email.`,
  }),

  REGISTER_OTP: (p) => ({
    subject: `${p.code} — Confirm your Sanjivani Blood Bank account`,
    html: renderLayout({
      title: 'Confirm Your Account',
      preheader: `${p.userName ? `Verification code for ${p.userName}: ` : ''}${p.code}. Expires in ${Math.round(p.expiresInSeconds / 60)} minute(s).`,
      bodyHtml: `
        <p>${p.userName ? `Hi <strong>${p.userName}</strong>, enter` : 'Enter'} the code below to complete your account registration
        with the Blood Bank Management System.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
          <tr>
            <td align="center">
              <div style="display:inline-block;background:#fee2e2;border:2px dashed #b91c1c;border-radius:12px;padding:18px 36px;text-align:center;">
                <p style="margin:0 0 4px;font-size:11px;color:#991b1b;letter-spacing:1px;text-transform:uppercase;font-weight:700;">Verification Code</p>
                <p style="margin:0;font-size:40px;font-weight:900;letter-spacing:10px;color:#b91c1c;font-family:monospace;">${p.code}</p>
              </div>
            </td>
          </tr>
        </table>
        <p style="text-align:center;font-size:13px;color:#71717a;">
          Expires in <strong>${Math.round(p.expiresInSeconds / 60)} minute(s)</strong>.
        </p>
        ${alertBanner('Your account will remain pending until an administrator approves it. You will receive a separate notification once approved.', 'info')}`,
    }),
    text: `${p.userName ? `Hi ${p.userName},\n\n` : ''}Your Sanjivani Blood Bank registration code: ${p.code}\n\nExpires in ${Math.round(p.expiresInSeconds / 60)} minute(s).\n\nYour account requires admin approval before it becomes active.`,
  }),
};

export function renderEmail<K extends NotificationType>(
  type: K,
  payload: TemplatePayloads[K],
): RenderedEmail {
  return RENDERERS[type](payload as never);
}
