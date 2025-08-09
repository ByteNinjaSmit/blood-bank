const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const InventorySchema = new Schema({
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
  bloodGroup: {
    type: String,
    required: true,
    trim: true
  },
  rh: {
    type: String,
    required: true,
    trim: true
  },
  componentType: {
    type: String,
    required: true,
    trim: true
  },
  volumeMl: {
    type: Number,
    required: true
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
  reservedFor: {
    type: Types.ObjectId,
    ref: 'HospitalRequest'
  },
  siteId: {
    type: Types.ObjectId,
    ref: 'Site',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Inventory = mongoose.model('Inventory', InventorySchema);

module.exports = Inventory;
