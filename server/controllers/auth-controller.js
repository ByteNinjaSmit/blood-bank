/*
POST /auth/login – Authenticate user & issue JWT
POST /auth/refresh – Refresh JWT token
POST /auth/logout – Invalidate token/session
POST /auth/change-password – Change password for logged-in user
GET /CURRENT-USER  For Verifying and Getting Data
*/

// controllers/auth-controller.js
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/user-model"); // Mongoose User model

// // Token expiry settings
// const ACCESS_TOKEN_EXPIRY = "15m";
// const REFRESH_TOKEN_EXPIRY = "7d";

// // In-memory refresh token store (replace with Redis/DB in production)
// let refreshTokens = [];

// // Helper: Generate tokens
// function generateTokens(user) {
//   const payload = {
//     id: user._id,
//     role: user.role,
//     email: user.email,
//   };

//   const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
//     expiresIn: ACCESS_TOKEN_EXPIRY,
//   });
//   const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
//     expiresIn: REFRESH_TOKEN_EXPIRY,
//   });

//   refreshTokens.push(refreshToken);
//   return { accessToken, refreshToken };
// }

const registerUser = async (req, res, next) => {
  try {
    // Destructure fields from the request body
    const {
      publicId,
      firstName,
      lastName,
      email,
      phone,
      role,
      password,
      createdBy,
      updatedBy,
    } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Check if phone already exists
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({ error: "Phone number already in use" });
    }

    // Create new user

    const newUser = await new User({
      publicId,
      name: {
        first: firstName,
        last: lastName,
      },
      email,
      phone,
      role,
      password,
      createdBy: createdBy || null, // If no createdBy provided, set it to null
      updatedBy: updatedBy || null, // If no updatedBy provided, set it to null
    });

    // Save the user to the database
    const savedUser = await newUser.save();

    if (!createdBy || !createdBy) {
      savedUser.updatedBy = savedUser._id;
      savedUser.createdBy = savedUser._id;
      await savedUser.save();
    }

    // Respond with user data and token
    return res.status(201).json({
      user: {
        publicId: savedUser.publicId,
        name: savedUser.name,
        email: savedUser.email,
        phone: savedUser.phone,
        role: savedUser.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Step 1: Find the user by email
    const user = await User.findOne({ email });

    // Step 2: Check if user exists
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Step 3: Check if the account is active (optional)
    if (user.status === "inactive") {
      return res
        .status(400)
        .json({ error: "Account is inactive. Please contact support." });
    }

    // Step 4: Compare the password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Step 5: Generate a JWT token
    const token = await user.generateToken();

    // Step 6: Update the last login time
    user.lastLoginAt = new Date();
    await user.save();

    // Step 7: Send the response with user data (excluding password) and the token
    return res.status(200).json({
      user: {
        userId:user._id,
        publicId: user.publicId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginUser,
  registerUser,
};
