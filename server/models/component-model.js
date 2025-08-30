const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const ComponentSchema = new Schema({
  componentId: {
    type: String,
    required: true,
    trim: true
  },
  donationId: {
    type: Types.ObjectId,
    ref: 'BloodBag', 
    required: true
  },
  componentType: {
    type: String,
    enum: ['RBC', 'FFP', 'Platelet', 'Cryo'],
    required: true
  },
  volumeMl: {
    type: Number,
    required: true
  },
  batchNo: {
    type: String,
    trim: true
  },
  rSeriesId: {
    type: String,
    trim: true
  },
  storageLocation: {
    type: String,
    // required: true,
    trim: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['in-stock', 'reserved', 'issued', 'discarded'],
    required: true
  },
  siteId: {
    type: Types.ObjectId,
    ref: 'Site',
    // required: true
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
},{
  timestamps:true,
});

// Auto-update updatedAt before save
ComponentSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Component = mongoose.model('Component', ComponentSchema);

module.exports = Component;
