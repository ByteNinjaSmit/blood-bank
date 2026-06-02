const mongoose = require('mongoose');
const { Schema } = mongoose;

const AppointmentSchema = new Schema({
  fullName: {
    type: String,
    required: false,
    trim: true,
  },
  gender: {
    type: String,
    required: false,
    trim: true,
  },
  mobileNo: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function (v) {
        return /^\d{10}$/.test(v);
      },
      message: (props) => `${props.value} is not a valid mobile number!`,
    },
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  bloodGroup: {
    type: String,
    required: false,
    trim: true,
  },
  birthDate: {
    type: Date,
    required: false,
  },
  age: {
    type: Number,
    required: false,
  },
  address: {
    type: String,
    required: false,
    trim: true,
  },
  appointmentDate: {
    type: Date,
    required: false,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending',
  },
  source: {
    type: String,
    default: 'public-frontend-nextjs',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  recentIllness: {
    type: String,
    default: 'no',
  },
  surgery: {
    type: String,
    default: 'no',
  },
  medication: {
    type: String,
    default: 'no',
  },
  lastDonation: {
    type: Date,
  },
  donationFrequency: {
    type: String,
    enum: ['1', '2', '3', '4'],
    default: '1',
  },
  wantReminder: {
    type: Boolean,
    default: false,
  },
  reminderDays: {
    type: Number,
    default: 0,
  },
});

AppointmentSchema.index({ appointmentDate: 1 });
AppointmentSchema.index({ mobileNo: 1 });

const Appointment = mongoose.model('Appointment', AppointmentSchema);

module.exports = Appointment;
