const mongoose = require("mongoose");
const User = require("../models/user-model");

const listUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select("-password");
    return res.status(200).json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { publicId, firstName, lastName, email, phone, role, password, permissions, siteId, status } = req.body;
    if (!publicId || !firstName || !lastName || !email || !role || !password) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    const user = new User({
      publicId,
      name: { first: firstName, last: lastName },
      email,
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

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, role, password, permissions, siteId, status } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ success: false, message: "Email already in use" });
      user.email = email;
    }

    if (typeof firstName === 'string') user.name.first = firstName;
    if (typeof lastName === 'string') user.name.last = lastName;
    if (typeof phone === 'string') user.phone = phone;
    if (typeof role === 'string') user.role = role;
    if (Array.isArray(permissions)) user.permissions = permissions;
    if (typeof status === 'string') user.status = status;
    if (siteId) user.siteId = siteId;
    if (typeof password === 'string' && password.trim()) user.password = password;

    user.updatedBy = req.user?._id || user.updatedBy;
    await user.save();
    const dto = user.toObject();
    delete dto.password;
    return res.status(200).json({ success: true, data: dto });
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
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

