import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import User from "../models/User.js";

// ================================
// GENERATE JWT TOKEN
// ================================
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

// ================================
// @desc    Register New User
// @route   POST /api/auth/register
// @access  Public
// ================================
export const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { username, email, password } = req.body;

    // CHECK EXISTING EMAIL
    const existingEmail = await User.findOne({ email });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        error: "Email already exists",
      });
    }

    // CHECK EXISTING USERNAME
    const existingUsername = await User.findOne({ username });

    if (existingUsername) {
      return res.status(400).json({
        success: false,
        error: "Username already exists",
      });
    }

    // CREATE USER
    const user = await User.create({
      username,
      email,
      password,
    });

    // GENERATE TOKEN
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// @desc    Login User
// @route   POST /api/auth/login
// @access  Public
// ================================
export const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
        statusCode: 400,
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Please provide email and password",
        statusCode: 400,
      });
    }

    // Password has select:false in schema
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
        statusCode: 401,
      });
    }

    // CHECK PASSWORD
    const isPasswordMatch = await user.matchPassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
        statusCode: 401,
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// @desc    Get User Profile
// @route   GET /api/auth/profile
// @access  Private
// ================================
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
        statusCode: 404
      });
    }

    res.status(200).json({
      success: true,
      user,
      // user: {
      //   id: user._id,
      //   username: user.username,
      //   email: user.email,
      //   profileImage: user.profileImage,
      //   createdAt: user.createdAt,
      //   updatedAt: user.updatedAt
      // },
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// @desc    Update User Profile
// @route   PUT /api/auth/profile
// @access  Private
// ================================
export const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
        statusCode: 400
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
        statusCode: 404
      });
    }

    const { username, email, profileImage } = req.body;

    if (username && username !== user.username) {
      const usernameExists = await User.findOne({ username });

      if (usernameExists) {
        return res.status(400).json({
          success: false,
          error: "Username already exists",
          statusCode: 400
        });
      }
      user.username = username;
    }

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          error: "Email already exists",
          statusCode: 400
        });
      }

      user.email = email;
    }

    if (profileImage !== undefined) {
      user.profileImage = profileImage;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ================================
// @desc    Change Password
// @route   PUT /api/auth/change-password
// @access  Private
// ================================
export const changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
        statusCode: 400
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
        statusCode: 404
      });
    }

    const isPasswordMatch = await user.matchPassword(currentPassword);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        error: "Current password is incorrect",
        statusCode: 401
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        error: "New password must be different from current password",
        statusCode: 400
      });
    }

    user.password = newPassword;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
};
