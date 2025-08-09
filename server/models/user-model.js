const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const UserSchema = new Schema({
  publicId: {
    type: String,
    required: true,
    unique: true, // assuming each publicId is unique like USR-2025-0001
  },
  name: {
    first: {
      type: String,
      required: true,
      trim: true,
    },
    last: {
      type: String,
      required: true,
      trim: true,
    }
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'lab-tech', 'inventory', 'hospital', 'viewer'],
    required: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  permissions: {
    type: [String],
    default: []
  },
  siteId: {
    type: Types.ObjectId,
    ref: 'Site',
    required: true
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: Types.ObjectId,
    ref: 'User',
    required: true
  }
});

// Optional: auto-update `updatedAt` field on save
UserSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const User = new mongoose.model('User', UserSchema);

module.exports = User;
