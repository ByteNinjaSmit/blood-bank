const mongoose = require('mongoose');
const { Schema, Types } = mongoose;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new Schema({
  publicId: {
    type: String,
    required: true,
    // unique: true, // assuming each publicId is unique like USR-2025-0001
  },
  name: {
    first: {
      type: String,
      required: true,
      trim: true,
    },
    last: {
      type: String,
      required: true,
      trim: true,
    },
  },
  email: {
    type: String,
    required: true,
    // unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function (v) {
        return /\d{10}/.test(v); // Example: Basic 10-digit phone number validation
      },
      message: (props) => `${props.value} is not a valid phone number!`,
    },
  },

  role: {
    type: String,
    enum: ['admin', 'lab-tech', 'inventory', 'hospital', 'viewer', 'staff'],
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'blocked', 'rejected'],
    default: 'active',
  },
  permissions: [
    {
      moduleName: { type: String, required: true },
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
  ],
  siteId: {
    type: Types.ObjectId,
    ref: 'Site',
    // required: true,
  },
  lastLoginAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: Types.ObjectId,
    ref: 'User',
    // required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  updatedBy: {
    type: Types.ObjectId,
    ref: 'User',
    // required: true,
  },
});

// // Optional: auto-update `updatedAt` field on save
// UserSchema.pre('save', function (next) {
//   this.updatedAt = new Date();
//   next();
// });

// secure the password

UserSchema.pre('save', async function (next) {
  const user = this;
  if (this.isModified()) {
    this.updatedAt = new Date();
  }

  if (!user.isModified('password')) {
    return next();
  }

  // If password already appears to be a bcrypt hash, skip re-hashing
  // This handles flows where a hashed password is assigned before save (e.g., OTP registration payload)
  const looksHashed =
    typeof user.password === 'string' &&
    /^(\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53})$/.test(user.password);
  if (looksHashed) {
    return next();
  }

  try {
    const saltRound = await bcrypt.genSalt(10);
    const hash_password = await bcrypt.hash(user.password, saltRound);
    user.password = hash_password;
  } catch (error) {
    next(error);
  }
});

// Compare bcrypt password

UserSchema.methods.comparePassword = async function (password) {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

// json web token
UserSchema.methods.generateToken = async function () {
  try {
    return jwt.sign(
      {
        userID: this._id.toString(),
        email: this.email,
        role: this.role,
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: '1h',
      },
    );
  } catch (error) {
    console.error(error);
    throw new Error('Error generating JWT token');
  }
};

const User = mongoose.model('User', UserSchema);

module.exports = User;
