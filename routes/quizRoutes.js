import express from "express";

import {
  getQuizzes,
  getQuizById,
  submitQuiz,
  getQuizResults,
  deleteQuiz,
} from "../controllers/quizController.js";

import protect from "../middleware/auth.js";

const router = express.Router();

// ==================================================
// PROTECT ALL QUIZ ROUTES
// ==================================================
// USER MUST BE LOGGED IN
// ==================================================

router.use(protect);

// ==================================================
// GET QUIZZES FOR A DOCUMENT
// GET /api/quizzes/:documentId
// ==================================================

router.get("/:documentId", getQuizzes);

// ==================================================
// GET SINGLE QUIZ
// GET /api/quizzes/quiz/:id
// ==================================================
// THIS ROUTE IS BEFORE THE GENERIC DELETE/SUBMIT
// ROUTES AND USES THE "quiz" PREFIX TO AVOID
// PARAMETER CONFLICTS.
// ==================================================

router.get("/quiz/:id", getQuizById);

// ==================================================
// SUBMIT QUIZ
// POST /api/quizzes/:id/submit
// ==================================================

router.post("/:id/submit", submitQuiz);

// ==================================================
// GET QUIZ RESULTS
// GET /api/quizzes/:id/results
// ==================================================

router.get("/:id/results", getQuizResults);

// ==================================================
// DELETE QUIZ
// DELETE /api/quizzes/:id
// ==================================================

router.delete("/:id", deleteQuiz);

// ==================================================
// EXPORT ROUTER
// ==================================================

export default router;
