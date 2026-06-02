const Donor = require('../models/donor-model');
const Appointment = require('../models/appointment-model');
const logger = require('../utils/logger');

function getTodayDayMonth() {
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth() + 1;
  return { day, month };
}

async function getTodayBirthdayRecipients() {
  const { day, month } = getTodayDayMonth();

  const donors = await Donor.find(
    {
      dob: { $ne: null },
      $expr: {
        $and: [{ $eq: [{ $dayOfMonth: '$dob' }, day] }, { $eq: [{ $month: '$dob' }, month] }],
      },
    },
    {
      'name.firstName': 1,
      'name.lastName': 1,
      phone: 1,
    },
  );

  const appointments = await Appointment.find(
    {
      birthDate: { $ne: null },
      $expr: {
        $and: [
          { $eq: [{ $dayOfMonth: '$birthDate' }, day] },
          { $eq: [{ $month: '$birthDate' }, month] },
        ],
      },
    },
    {
      fullName: 1,
      mobileNo: 1,
    },
  );

  const donorRecipients = donors
    .filter((d) => d.phone)
    .map((d) => {
      const firstName = (d.name && d.name.firstName) || '';
      const lastName = (d.name && d.name.lastName) || '';
      const name = `${firstName} ${lastName}`.trim() || 'Donor';
      return {
        id: d._id.toString(),
        phone: d.phone,
        name,
        source: 'donor',
      };
    });

  const appointmentRecipients = appointments
    .filter((a) => a.mobileNo)
    .map((a) => ({
      id: a._id.toString(),
      phone: a.mobileNo,
      name: a.fullName || 'Donor',
      source: 'appointment',
    }));

  const combined = [...donorRecipients, ...appointmentRecipients];

  const map = new Map();
  for (const recipient of combined) {
    const key = String(recipient.phone || '').trim();
    if (!key) {
      continue;
    }
    if (!map.has(key)) {
      map.set(key, recipient);
    }
  }

  const uniqueRecipients = Array.from(map.values());
  logger.info(
    `[BirthdayService] Found ${uniqueRecipients.length} unique recipients for today (donors: ${donorRecipients.length}, appointments: ${appointmentRecipients.length})`,
  );

  return uniqueRecipients;
}

function buildBirthdayMessage(recipient) {
  const name = (recipient && recipient.name) || 'Donor';
  return (
    `Dear ${name},\n\n` +
    'Warm birthday wishes from Sanjivani Blood Bank! ' +
    'Thank you for being part of our life-saving community.\n\n' +
    'Best wishes,\n' +
    'Sanjivani Blood Bank'
  );
}

module.exports = { getTodayBirthdayRecipients, buildBirthdayMessage };
