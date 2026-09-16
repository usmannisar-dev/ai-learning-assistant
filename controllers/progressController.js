import Document from "../models/Document.js";
import Flashcard from "../models/Flashcard.js";
import Quiz from "../models/Quiz.js";

// ==================================================
// GET USER LEARNING DASHBOARD
// GET /api/progress/dashboard
// PRIVATE
// ==================================================

export const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // ==================================================
    // BASIC COUNTS
    // ==================================================

    const totalDocuments = await Document.countDocuments({
      userId,
    });

    const totalFlashcardSets = await Flashcard.countDocuments({
      userId,
    });

    const totalQuizzes = await Quiz.countDocuments({
      userId,
    });

    const completedQuizzes = await Quiz.countDocuments({
      userId,
      completedAt: { $ne: null },
    });

    // ==================================================
    // FLASHCARD STATISTICS
    // ==================================================

    const flashcardSets = await Flashcard.find({
      userId,
    }).select("cards");

    let totalFlashcards = 0;
    let reviewedFlashcards = 0;
    let starredFlashcards = 0;

    flashcardSets.forEach((set) => {
      totalFlashcards += set.cards.length;

      reviewedFlashcards += set.cards.filter(
        (card) => card.reviewCount > 0,
      ).length;

      starredFlashcards += set.cards.filter(
        (card) => card.isStarred === true,
      ).length;
    });

    // ==================================================
    // QUIZ STATISTICS
    // ==================================================

    const completedQuizDocuments = await Quiz.find({
      userId,
      completedAt: { $ne: null },
    }).select("score");

    const averageScore =
      completedQuizDocuments.length > 0
        ? Math.round(
            completedQuizDocuments.reduce((sum, quiz) => sum + quiz.score, 0) /
              completedQuizDocuments.length,
          )
        : 0;

    // ==================================================
    // RECENT DOCUMENTS
    // ==================================================

    const recentDocuments = await Document.find({
      userId,
    })
      .sort({ lastAccessed: -1, createdAt: -1 })
      .limit(5)
      .select("title fileName lastAccessed status");

    // ==================================================
    // RECENT QUIZZES
    // ==================================================

    const recentQuizzes = await Quiz.find({
      userId,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("documentId", "title")
      .select("title score totalQuestions completedAt createdAt");

    // ==================================================
    // STUDY STREAK
    // ==================================================
    // TODO:
    // Implement real daily study activity tracking
    // using a StudyActivity model.

    const studyStreak = 0;

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,

      data: {
        overview: {
          totalDocuments,
          totalFlashcardSets,
          totalFlashcards,
          reviewedFlashcards,
          starredFlashcards,
          totalQuizzes,
          completedQuizzes,
          averageScore,
          studyStreak,
        },

        recentActivity: {
          documents: recentDocuments,
          quizzes: recentQuizzes,
        },
      },

      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};
