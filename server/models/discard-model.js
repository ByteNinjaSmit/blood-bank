const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const DiscardLogSchema = new Schema({
  itemType: {
    type: String,
    enum: ['Donation', 'Component'],
    required: true
  },
  itemId: {
    type: Types.ObjectId,
    required: true
  },
  bagNo: {
    type: String,
    required: true,
    trim: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  discardedAt: {
    type: Date,
    required: true
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

const DiscardLog = mongoose.model('DiscardLog', DiscardLogSchema);

module.exports = DiscardLog;
