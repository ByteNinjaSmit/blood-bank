const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const HospitalSchema = new Schema({
  hospitalId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  contactPerson: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  licenseNo: {
    type: String,
    trim: true
  },
  siteId: {
    type: Types.ObjectId,
    ref: 'Site',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-update updatedAt on save
HospitalSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Hospital = mongoose.model('Hospital', HospitalSchema);

module.exports = Hospital;
