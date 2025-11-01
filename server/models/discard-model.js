const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const DiscardLogSchema = new Schema({
  /** Whether the discarded item is a whole bag or a separated component */
  itemType: {
    type: String,
    enum: ['Bag', 'Component'],
    required: true,
  },

  /** Reference to the discarded blood bag */
  bagNo: {
    type: Types.ObjectId,
    ref: 'BloodBag',
    required: true,
  },

  /** Reference to a specific discarded component (if itemType === 'Component') */
  componentId: {
    type: Types.ObjectId,
    ref: 'Component',
    default: null,
  },

  /** Reason for discarding (Expired, Damaged, Contaminated, etc.) */
  reason: {
    type: String,
    trim: true,
    default: 'Expired',
  },

  /** Exact time when the item was discarded */
  discardedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },

  /** Site reference where discard occurred */
  siteId: {
    type: Types.ObjectId,
    ref: 'Site',
    default: null,
  },

  /** User who performed or triggered the discard */
  updatedBy: {
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  },

  /** Whether this discard was done automatically by the system or manually */
  isAutoDiscarded: {
    type: Boolean,
    default: false,
  },

  /** Created timestamp */
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for faster reporting
DiscardLogSchema.index({ discardedAt: -1 });
DiscardLogSchema.index({ itemType: 1, bagNo: 1 });
DiscardLogSchema.index({ isAutoDiscarded: 1 });

const DiscardLog = mongoose.model('DiscardLog', DiscardLogSchema);

module.exports = DiscardLog;
