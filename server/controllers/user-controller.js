/*
POST /users – Create new system user (admin only)
GET /users – List all users (with filters for role/status)
GET /users/:id – Get user details
PUT /users/:id – Update user profile/role/permissions
DELETE /users/:id – Soft delete / deactivate user
*/

const User = require('../models/user-model');
const mongoose = require('mongoose');

// Generate a unique user ID (e.g., USR-2023-0001)
const generateUniqueUserId = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `USR-${currentYear}-`;

  // Find the highest existing ID for this year
  const highestUser = await User.findOne(
    { publicId: new RegExp(`^${prefix}`) },
    { publicId: 1 },
    { sort: { publicId: -1 } },
  );

  let nextNumber = 1;
  if (highestUser && highestUser.publicId) {
    const currentNumber = parseInt(highestUser.publicId.split('-')[2]);
    nextNumber = currentNumber + 1;
  }

  // Format with leading zeros (e.g., 0001)
  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
};

// Create a new user (admin only)
const createUser = async (req, res, next) => {
  try {
    // Check if the current user has admin role (should be handled by middleware)
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Only administrators can create new users'
    //   });
    // }

    const { firstName, lastName, email, phone, role, password, permissions, siteId } = req.body;

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Generate a unique public ID
    const publicId = await generateUniqueUserId();

    // Create the new user
    const newUser = new User({
      publicId,
      name: {
        first: firstName,
        last: lastName,
      },
      email,
      phone,
      role,
      password,
      permissions: permissions || [],
      siteId: siteId || null,
      createdBy: req.user ? req.user._id : null,
      updatedBy: req.user ? req.user._id : null,
    });

    await newUser.save();

    // Return the created user (without password)
    const userResponse = newUser.toObject();
    delete userResponse.password;

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse,
    });
  } catch (error) {
    next(error);
  }
};

// List all users with optional filters
const listUsers = async (req, res, next) => {
  try {
    const { role, status, siteId, search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object based on query parameters
    const filter = {};

    if (role) filter.role = role;
    if (status) filter.status = status;
    if (siteId) filter.siteId = siteId;

    // Add search functionality for name or email
    if (search) {
      filter.$or = [
        { 'name.first': { $regex: search, $options: 'i' } },
        { 'name.last': { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Count total documents for pagination
    const totalUsers = await User.countDocuments(filter);

    // Get users with pagination
    const users = await User.find(filter)
      .select('-password') // Exclude password
      .populate('siteId', 'name location')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total: totalUsers,
        page,
        limit,
        pages: Math.ceil(totalUsers / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get user details by ID
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) && !id.startsWith('USR-')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    // Find by MongoDB ID or publicId
    const query = id.startsWith('USR-') ? { publicId: id } : { _id: id };

    const user = await User.findOne(query).select('-password').populate('siteId', 'name location');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile/role/permissions
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, role, password, permissions, siteId, status } =
      req.body;

    if (!mongoose.Types.ObjectId.isValid(id) && !id.startsWith('USR-')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    // Find by MongoDB ID or publicId
    const query = id.startsWith('USR-') ? { publicId: id } : { _id: id };

    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if email is being changed and if it's already in use
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use by another user',
        });
      }
      user.email = email;
    }

    // Update user fields if provided
    if (firstName) user.name.first = firstName;
    if (lastName) user.name.last = lastName;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (permissions) user.permissions = permissions;
    if (siteId) user.siteId = siteId;
    if (status) user.status = status;

    // Only update password if provided
    if (password) {
      user.password = password; // Will be hashed by pre-save hook
    }

    // Update the updatedBy field
    user.updatedBy = req.user ? req.user._id : null;

    await user.save();

    // Return the updated user (without password)
    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: userResponse,
    });
  } catch (error) {
    next(error);
  }
};

// Soft delete / deactivate user
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) && !id.startsWith('USR-')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    // Find by MongoDB ID or publicId
    const query = id.startsWith('USR-') ? { publicId: id } : { _id: id };

    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Soft delete by setting status to inactive
    user.status = 'inactive';
    user.updatedBy = req.user ? req.user._id : null;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUser,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
};
