const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const InventorySchema = new Schema({
  componentId: {
    type: Types.ObjectId,
    ref: 'Component',
    required: true
  },
  bagNo: {
    type: Types.ObjectId,
    ref: 'BloodBag',
    required: true
  },
  status: {
    type: String,
    enum: ['in-stock', 'reserved', 'issued', 'discarded'],
    required: true
  },
  inStockDate: {
    type: Date,
    required: true,
  },
  reservedFor: {
    type: Types.ObjectId,
    ref: 'HospitalRequest'
  },
  reservedForHospital: {
    type: Types.ObjectId,
    ref: 'Hospital'
  },
  reservedAt: {
    type: Date,
  },
  reservedUntil: {
    type: Date,
  },
  reservedPatientName: {
    type: String,
  },
  reservedPatientAge: {
    type: Number,
  },
  reservedPatientSex: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  issuedAt: {
    type: Date,
  },
  issuedBy: {
    type: Types.ObjectId, 
    ref: "User" 
  },
  createdBy: {
    type: Types.ObjectId,
    ref: "User",
    required: true,
  },
}, {
  timestamps: true,
});

const Inventory = mongoose.model('Inventory', InventorySchema);

module.exports = Inventory;
