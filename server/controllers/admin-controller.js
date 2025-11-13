const mongoose = require("mongoose");
const User = require("../models/user-model");

// -----------------------------
// Helpers
// -----------------------------
const isValidObjectId = (id) => mongoose.isValidObjectId(id);
const normalizeEmail = (e) => String(e || "").trim().toLowerCase();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// -----------------------------
// List Users
// -----------------------------
const listUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select("-password");
    return res.status(200).json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

// -----------------------------
// Create User
// -----------------------------
const createUser = async (req, res, next) => {
  try {
    const { publicId, firstName, lastName, email, phone, role, password, permissions, siteId, status } = req.body;

    // Required fields validation
    if (!publicId || !firstName || !lastName || !email || !role || !password) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Email format + duplicate (case-insensitive)
    const normEmail = normalizeEmail(email);
    if (!EMAIL_REGEX.test(normEmail)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }
    const emailExists = await User.findOne({ email: { $regex: `^${normEmail}$`, $options: 'i' } });
    if (emailExists) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    // Phone duplicate (optional)
    if (phone && await User.findOne({ phone })) {
      return res.status(400).json({ success: false, message: "Phone number already exists" });
    }

    const user = new User({
      publicId,
      name: { first: firstName, last: lastName },
      email: normEmail,
      phone,
      role,
      password,
      permissions: Array.isArray(permissions) ? permissions : [],
      siteId: siteId || null,
      status: status || "active",
      createdBy: req.user?._id || null,
      updatedBy: req.user?._id || null,
    });

    const saved = await user.save();
    const dto = saved.toObject();
    delete dto.password;

    return res.status(201).json({ success: true, data: dto });
  } catch (err) {
    next(err);
  }
};

// -----------------------------
// Update User
// -----------------------------
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID format" });
    }

    const { firstName, lastName, email, phone, role, password, permissions, siteId, status } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Email already taken by another user (case-insensitive)
    if (typeof email === 'string' && email.trim()) {
      const normEmail = normalizeEmail(email);
      if (!EMAIL_REGEX.test(normEmail)) {
        return res.status(400).json({ success: false, message: "Invalid email format" });
      }
      if (normEmail !== user.email) {
        const other = await User.findOne({ email: { $regex: `^${normEmail}$`, $options: 'i' } });
        if (other && String(other._id) !== String(user._id)) {
          return res.status(400).json({ success: false, message: "Email already in use" });
        }
        user.email = normEmail;
      }
    }

    // Phone check (optional)
    if (phone && phone !== user.phone) {
      if (await User.findOne({ phone })) {
        return res.status(400).json({ success: false, message: "Phone number already in use" });
      }
      user.phone = phone;
    }

    if (typeof firstName === "string") user.name.first = firstName;
    if (typeof lastName === "string") user.name.last = lastName;
    if (typeof role === "string") user.role = role;
    if (Array.isArray(permissions)) user.permissions = permissions;
    if (typeof status === "string") user.status = status;

    if (siteId && isValidObjectId(siteId)) user.siteId = siteId;

    if (typeof password === "string" && password.trim()) user.password = password;

    user.updatedBy = req.user?._id || user.updatedBy;

    await user.save();

    const dto = user.toObject();
    delete dto.password;

    return res.status(200).json({ success: true, data: dto });
  } catch (err) {
    next(err);
  }
};

// -----------------------------
// Delete User
// -----------------------------
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID format" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    await user.deleteOne();
    return res.status(200).json({ success: true, message: "User deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
};

// -----------------------------
// Status transitions: approve/reject/block/activate
// -----------------------------
const setStatus = async (req, res, next, status) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID format" });
    }
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.status = status;
    user.updatedBy = req.user?._id || user.updatedBy;
    await user.save();
    const dto = user.toObject();
    delete dto.password;
    return res.status(200).json({ success: true, data: dto });
  } catch (err) {
    next(err);
  }
};

const approveUser = (req, res, next) => setStatus(req, res, next, 'active');
const rejectUser = (req, res, next) => setStatus(req, res, next, 'rejected');
const blockUser = (req, res, next) => setStatus(req, res, next, 'blocked');
const deactivateUser = (req, res, next) => setStatus(req, res, next, 'inactive');

module.exports.approveUser = approveUser;
module.exports.rejectUser = rejectUser;
module.exports.blockUser = blockUser;
module.exports.deactivateUser = deactivateUser;
