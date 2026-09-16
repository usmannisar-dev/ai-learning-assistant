import express from "express";

import { getDashboard } from "../controllers/progressController.js";

import protect from "../middleware/auth.js";

const router = express.Router();

// ==================================================
// PROTECT ALL PROGRESS ROUTES
// ==================================================
// USER MUST BE LOGGED IN TO ACCESS PROGRESS DATA
// ==================================================

router.use(protect);

// ==================================================
// GET DASHBOARD PROGRESS
// GET /api/progress/dashboard
// ==================================================

router.get("/dashboard", getDashboard);

// ==================================================
// EXPORT ROUTER
// ==================================================

export default router;
