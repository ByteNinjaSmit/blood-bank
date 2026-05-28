const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const HospitalRequestSchema = new Schema({
  requestId: {
    type: String,
    required: true,
    trim: true
  },
  hospitalId: {
    type: Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  doctorName: {
    type: String,
    trim: true
  },
  requiredAt: {
    type: Date
  },
  medicalOfficerSignature: {
    type: String,
    trim: true
  },
  hospitalSeal: {
    type: String,
    trim: true
  },
  patient: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    age: {
      type: Number,
      required: true
    },
    sex: {
      type: String,
      enum: ['M', 'F', 'O'],
      required: true
    },
    mrn: {
      type: String,
      trim: true
    },
    diagnosis: {
      type: String,
      trim: true
    },
    indication: {
      type: String,
      trim: true
    },
    hb: {
      type: Number
    },
    history: {
      previousTransfusions: {
        type: Number,
        default: 0
      },
      approximateDate: {
        type: String,
        trim: true
      },
      presenceOfReaction: {
        type: String,
        enum: ['Presence', 'Absence', 'None'],
        default: 'None'
      }
    },
    pregnancy: {
      numPregnancies: {
        type: Number,
        default: 0
      },
      numMiscarriages: {
        type: Number,
        default: 0
      },
      numChildrenWithHemolyticDisease: {
        type: Number,
        default: 0
      }
    }
  },
  requestedComponents: [
    {
      componentType: {
        type: String,
        enum: ['RBC', 'FFP', 'Platelet', 'Cryo'],
        required: true
      },
      units: {
        type: Number,
        required: true
      },
      bloodGroup: {
        type: String,
        required: true
      },
      rh: {
        type: String,
        enum: ['Positive', 'Negative'],
        required: true
      },
      urgency: {
        type: String,
        enum: ['regular', 'urgent'],
        required: true
      }
    }
  ],
  matchedInventory: [
    {
      inventoryId: {
        type: Types.ObjectId,
        ref: 'Inventory',
        required: true
      },
      reservedAt: {
        type: Date,
        default: Date.now
      },
      compatibilityType: {
        type: String,
        enum: ['exact', 'compatible'],
        default: 'exact'
      },
      crossmatchRequired: {
        type: Boolean,
        default: false
      },
      crossmatchStatus: {
        type: String,
        enum: ['not-required', 'pending', 'compatible', 'incompatible'],
        default: 'not-required'
      }
    }
  ],
  status: {
    type: String,
    enum: ['pending', 'matched', 'approved', 'issued', 'completed', 'rejected'],
    default: 'pending'
  },
  requestedAt: { type: Date, default: Date.now },
  approvedAt: Date,
  issuedAt: Date,
  completedAt: Date,

  approvedBy: { type: Types.ObjectId, ref: "User" },
  rejectionReason: {
    type: String,
    trim: true
  },
  rejectedAt: {
    type: Date
  },
  rejectedBy: {
    type: Types.ObjectId,
    ref: 'User'
  },
  issuedBy: { type: Types.ObjectId, ref: "User" },
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
HospitalRequestSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const HospitalRequest = mongoose.model('HospitalRequest', HospitalRequestSchema);

module.exports = HospitalRequest;
