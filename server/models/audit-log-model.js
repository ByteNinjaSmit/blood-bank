const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const AuditLogSchema = new Schema({
  entityType: {
    type: String,
    required: true,
    trim: true
    // e.g., 'Donation', 'Component', 'Request', etc.
  },
  entityId: {
    type: Types.ObjectId,
    required: true
  },
  action: {
    type: String,
    enum: ['created', 'updated', 'deleted', 'status-change'],
    required: true
  },
  changes: {
    type: Schema.Types.Mixed, // Stores any arbitrary object structure
    required: true
  },
  performedBy: {
    type: Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  siteId: {
    type: Types.ObjectId,
    ref: 'Site',
    required: true
  }
});

const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

module.exports = AuditLog;
