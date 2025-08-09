const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const TransfusionSchema = new Schema({
  transfusionId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  hospitalRequestId: {
    type: Types.ObjectId,
    ref: 'HospitalRequest',
    required: true
  },
  componentId: {
    type: Types.ObjectId,
    ref: 'Component',
    required: true
  },
  bagNo: {
    type: String,
    required: true,
    trim: true
  },
  donorId: {
    type: Types.ObjectId,
    ref: 'Donor',
    required: true
  },
  crossmatch: {
    result: {
      type: String,
      enum: ['compatible', 'incompatible'],
      required: true
    },
    details: {
      type: String,
      trim: true
    },
    testedAt: {
      type: Date,
      required: true
    },
    technicianId: {
      type: Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  transfusionStart: {
    type: Date,
    required: true
  },
  transfusionEnd: {
    type: Date,
    required: true
  },
  outcome: {
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

// Auto-update `updatedAt`
TransfusionSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Transfusion = mongoose.model('Transfusion', TransfusionSchema);

module.exports = Transfusion;
