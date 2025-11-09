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
        required:true,
   },
  reservedFor: {
    type: Types.ObjectId,
    ref: 'HospitalRequest'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
    createdBy: {
    type: Types.ObjectId,
    ref: "User",
    required: true,
  },
},{
  timestamps:true,
});

const Inventory = mongoose.model('Inventory', InventorySchema);

module.exports = Inventory;
