const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const BloodBagSchema = new Schema({
  bagNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  segmentNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  batchNo: {
    type: String,
    trim: true
  },
  typeOfBag: {
    type: String,
    enum: ['DB', 'TB', 'QB'],
    required: true
  },
  donor: {
    type: Types.ObjectId,
    ref: 'Donor',
    required: true
  },
  collectionDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  initialVitals: {
    hb: {
      type: Number,
      required: true
    },
    weightKg: {
      type: Number,
      required: true
    },
    pulse: {
      type: Number,
      required: true
    },
    tempC: {
      type: Number,
      required: true
    },
    bp: {
      type: String,
      required: true
    }
  },
  bloodGroup: {
    type: String,
    enum: ['A', 'B', 'AB', 'O', 'Unknown'],
    required: true
  },
  rh: {
    type: String,
    enum: ['Positive', 'Negative', 'Unknown'],
    required: true
  },
  atypicalAntibody: {
    type: String,
    trim: true
  },
  testResults: [
    {
      test: {
        type: String,
        enum: ['HIV', 'HBsAg', 'HCV', 'VDRL', 'MP'],
        required: true
      },
      result: {
        type: String,
        enum: ['Positive', 'Negative', 'Indeterminate'],
        required: true
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
    }
  ],
  status: {
    type: String,
    enum: [
      'collected',
      'testing',
      'passed',
      'failed',
      'quarantined',
      'component-separated',
      'issued',
      'discarded'
    ],
    required: true
  },
  quarantineReason: {
    type: String,
    trim: true
  },
  components: [
    {
      type: Types.ObjectId,
      ref: 'Component'
    }
  ],
  siteId: {
    type: Types.ObjectId,
    ref: 'Site',
    required: true
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

// Auto-update updatedAt before save
BloodBagSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const BloodBag = mongoose.model('BloodBag', BloodBagSchema);

module.exports = BloodBag;
