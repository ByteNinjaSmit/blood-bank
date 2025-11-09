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
const RefreshToken = require("../models/refresh-token-model");
const authService = require("../services/auth-service");

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

    if(!publicId || !firstName || !lastName || !role || !email || !password){
      return res.status(400).json({message:"All Fields Are Required"})
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Check if phone already exists
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({ message: "Phone number already in use" });
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
      return res.status(400).json({ message: "Invalid credentials" });
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
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Step 5: Generate tokens
    const { accessToken, refreshToken } = await authService.generateTokenPair(user, req.ip);

    // Step 6: Update the last login time
    user.lastLoginAt = new Date();
    await user.save();

    // Step 7: Set refresh cookie and return access token
    authService.setRefreshCookie(res, refreshToken);
    return res.status(200).json({
      user: {
        userId: user._id,
        publicId: user.publicId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      accessToken,
      expiresIn: authService.ACCESS_TTL,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------
// GET Current Logged User detail
// ---------------------------

const getCurrentUser = async (req, res, next) => {
  try {
    const auth = req.header("Authorization");
    if (!auth) return res.status(401).json({ message: "Unauthorized" });
    const jwtToken = auth.replace("Bearer", "").trim();
    const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET_KEY);
    const { userID } = decoded;

    // Fetch user
    const userData = await User.findById(userID).select("-password");

    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }


    return res.status(200).json({
      user: userData,
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const tokenCookie = req.cookies?.refreshToken;
    if (!tokenCookie) return res.status(401).json({ message: "Unauthorized" });

    let decoded;
    try {
      decoded = jwt.verify(tokenCookie, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET_KEY);
    } catch (e) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await User.findById(decoded.userID);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const newRefresh = await authService.rotateRefreshToken(tokenCookie, user._id, req.ip);
    const accessToken = authService.signAccessToken({ userID: user._id.toString(), email: user.email, role: user.role });
    authService.setRefreshCookie(res, newRefresh);
    return res.status(200).json({ accessToken, expiresIn: authService.ACCESS_TTL });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const tokenCookie = req.cookies?.refreshToken;
    if (tokenCookie) await authService.revokeRefreshToken(tokenCookie, req.ip);
    authService.clearRefreshCookie(res);
    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginUser,
  registerUser,
  getCurrentUser,
  refreshToken,
  logout,
};
