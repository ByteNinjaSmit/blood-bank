const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Site Schema
const siteSchema = new Schema(
  {
    siteId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    address: {
      type: String,
      required: true,
    },
    contactInfo: {
      phone: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
    },
    // Camp Duration
    dateFrom: {
      type: Date,
      required: true, // mark as required if every camp must have a start
    },
    dateTo: {
      type: Date,
      required: true, // mark as required if every camp must have an end
      validate: {
        validator: function (value) {
          return this.dateFrom < value;
        },
        message: 'End date must be after start date.',
      },
    },

    // Reference to the User who created the site
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Reference to the User who last updated the site
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Array of staff assigned to this site (User references)
    staff: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // Donor Data
    donorData: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Donor',
      },
    ],

    // Bags Data

    bagsData: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BloodBag',
      },
    ],

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  },
);

// Create and export the model
const Site = mongoose.model('Site', siteSchema);
module.exports = Site;
