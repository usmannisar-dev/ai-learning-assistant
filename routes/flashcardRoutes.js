import express from "express";

import {
  getFlashcards,
  getAllFlashcardSets,
  reviewFlashcard,
  toggleStarFlashcard,
  deleteFlashcardSet,
} from "../controllers/flashcardController.js";

import protect from "../middleware/auth.js";

const router = express.Router();

// ==================================================
// PROTECT ALL FLASHCARD ROUTES
// ==================================================
// USER MUST BE LOGGED IN
// ==================================================

router.use(protect);

// ==================================================
// GET ALL FLASHCARD SETS
// GET /api/flashcards
// ==================================================

router.get("/", getAllFlashcardSets);

// ==================================================
// GET FLASHCARDS FOR A DOCUMENT
// GET /api/flashcards/:documentId
// ==================================================

router.get("/:documentId", getFlashcards);

// ==================================================
// REVIEW A FLASHCARD
// PUT /api/flashcards/:cardId/review
// ==================================================

router.put("/:cardId/review", reviewFlashcard);

// Keep POST supported for older frontend builds that used this endpoint.
router.post("/:cardId/review", reviewFlashcard);

// ==================================================
// TOGGLE STAR ON A FLASHCARD
// PUT /api/flashcards/:cardId/star
// ==================================================

router.put("/:cardId/star", toggleStarFlashcard);

// ==================================================
// DELETE FLASHCARD SET
// DELETE /api/flashcards/:id
// ==================================================

router.delete("/:id", deleteFlashcardSet);

// ==================================================
// EXPORT ROUTER
// ==================================================

export default router;
