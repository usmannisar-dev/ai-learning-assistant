import express from "express";

import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
} from "../controllers/authController.js";

import protect from "../middleware/auth.js";

const router = express.Router();

// ==================================================
// REGISTER USER
// POST /api/auth/register
// PUBLIC
// ==================================================

router.post("/register", register);

// ==================================================
// LOGIN USER
// POST /api/auth/login
// PUBLIC
// ==================================================

router.post("/login", login);

// ==================================================
// GET USER PROFILE
// GET /api/auth/profile
// PRIVATE
// ==================================================

router.get("/profile", protect, getProfile);

// ==================================================
// UPDATE USER PROFILE
// PUT /api/auth/profile
// PRIVATE
// ==================================================

router.put("/profile", protect, updateProfile);

// ==================================================
// CHANGE USER PASSWORD
// PUT /api/auth/change-password
// PRIVATE
// ==================================================

router.put("/change-password", protect, changePassword);

// ==================================================
// EXPORT ROUTER
// ==================================================

export default router;
