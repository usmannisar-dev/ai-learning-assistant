import mongoose from "mongoose";
import Flashcard from "../models/Flashcard.js";

// ==================================================
// GET FLASHCARDS FOR DOCUMENT
// GET /api/flashcards/:documentId
// PRIVATE
// ==================================================

export const getFlashcards = async (req, res, next) => {
  try {
    const { documentId } = req.params;

    // ========================================
    // VALIDATE DOCUMENT ID
    // ========================================

    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid document ID",
        statusCode: 400,
      });
    }

    // ========================================
    // FIND FLASHCARD SETS
    // ========================================

    const flashcards = await Flashcard.find({
      userId: req.user._id,
      documentId,
    })
      .populate("documentId", "title fileName")
      .sort({
        createdAt: -1,
      });

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(200).json({
      success: true,
      count: flashcards.length,
      data: flashcards,
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

// ==================================================
// GET ALL FLASHCARD SETS
// GET /api/flashcards
// PRIVATE
// ==================================================

export const getAllFlashcardSets = async (req, res, next) => {
  try {
    const flashcardSets = await Flashcard.find({
      userId: req.user._id,
    })
      .populate("documentId", "title fileName")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: flashcardSets.length,
      data: flashcardSets,
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

// ==================================================
// REVIEW FLASHCARD
// POST /api/flashcards/:cardId/review
// PRIVATE
// ==================================================

export const reviewFlashcard = async (req, res, next) => {
  try {
    const { cardId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(cardId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid flashcard ID",
        statusCode: 400,
      });
    }

    // ========================================
    // FIND SET CONTAINING CARD
    // ========================================

    const flashcardSet = await Flashcard.findOne({
      "cards._id": cardId,

      userId: req.user._id,
    });

    if (!flashcardSet) {
      return res.status(404).json({
        success: false,
        error: "Flashcard set or card not found",
        statusCode: 404,
      });
    }

    // ========================================
    // FIND CARD INDEX
    // ========================================

    const cardIndex = flashcardSet.cards.findIndex(
      (card) => card._id.toString() === cardId,
    );

    if (cardIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Card not found in set",
        statusCode: 404,
      });
    }

    // ========================================
    // UPDATE REVIEW INFORMATION
    // ========================================

    flashcardSet.cards[cardIndex].lastReviewed = new Date();

    flashcardSet.cards[cardIndex].reviewCount =
      (flashcardSet.cards[cardIndex].reviewCount || 0) + 1;

    await flashcardSet.save();

    return res.status(200).json({
      success: true,

      data: flashcardSet.cards[cardIndex],

      message: "Flashcard reviewed successfully",

      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

// ==================================================
// TOGGLE FLASHCARD STAR
// PUT /api/flashcards/:cardId/star
// PRIVATE
// ==================================================

export const toggleStarFlashcard = async (req, res, next) => {
  try {
    const { cardId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(cardId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid flashcard ID",
        statusCode: 400,
      });
    }

    // ========================================
    // FIND FLASHCARD SET
    // ========================================

    const flashcardSet = await Flashcard.findOne({
      "cards._id": cardId,

      userId: req.user._id,
    });

    if (!flashcardSet) {
      return res.status(404).json({
        success: false,
        error: "Flashcard set or card not found",
        statusCode: 404,
      });
    }

    // ========================================
    // FIND CARD
    // ========================================

    const cardIndex = flashcardSet.cards.findIndex(
      (card) => card._id.toString() === cardId,
    );

    if (cardIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Card not found in set",
        statusCode: 404,
      });
    }

    // ========================================
    // TOGGLE STAR
    // ========================================

    const card = flashcardSet.cards[cardIndex];

    card.isStarred = !card.isStarred;

    await flashcardSet.save();

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(200).json({
      success: true,

      data: card,

      message: `Flashcard ${
        card.isStarred ? "starred" : "unstarred"
      } successfully`,

      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

// ==================================================
// DELETE FLASHCARD SET
// DELETE /api/flashcards/:id
// PRIVATE
// ==================================================

export const deleteFlashcardSet = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid flashcard set ID",
        statusCode: 400,
      });
    }

    const flashcardSet = await Flashcard.findOne({
      _id: id,

      userId: req.user._id,
    });

    if (!flashcardSet) {
      return res.status(404).json({
        success: false,
        error: "Flashcard set not found",
        statusCode: 404,
      });
    }

    await flashcardSet.deleteOne();

    return res.status(200).json({
      success: true,

      message: "Flashcard set deleted successfully",

      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};
