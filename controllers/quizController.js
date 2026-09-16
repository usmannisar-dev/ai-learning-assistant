import mongoose from "mongoose";

import Quiz from "../models/Quiz.js";

// ==================================================
// GET ALL QUIZZES FOR A DOCUMENT
// GET /api/quizzes/:documentId
// PRIVATE
// ==================================================

export const getQuizzes = async (req, res, next) => {
  try {
    const { documentId } = req.params;

    // ==========================================
    // VALIDATE DOCUMENT ID
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid document ID",
        statusCode: 400,
      });
    }

    // ==========================================
    // FIND QUIZZES
    // ==========================================

    const quizzes = await Quiz.find({
      userId: req.user._id,
      documentId,
    })
      .populate("documentId", "title fileName")
      .sort({ createdAt: -1 });

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      count: quizzes.length,
      data: quizzes,
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

// ==================================================
// GET SINGLE QUIZ
// GET /api/quizzes/quiz/:id
// PRIVATE
// ==================================================

export const getQuizById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // ==========================================
    // VALIDATE QUIZ ID
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid quiz ID",
        statusCode: 400,
      });
    }

    // ==========================================
    // FIND QUIZ
    // ==========================================

    const quiz = await Quiz.findOne({
      _id: id,

      // IMPORTANT:
      // It is userId, NOT userid
      userId: req.user._id,
    }).populate("documentId", "title fileName");

    // ==========================================
    // CHECK QUIZ
    // ==========================================

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: "Quiz not found",
        statusCode: 404,
      });
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      data: quiz,
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================================
// SUBMIT QUIZ
// POST /api/quizzes/:id/submit
// PRIVATE
// ==========================================================

export const submitQuiz = async (req, res, next) => {
  try {
    const { answers } = req.body;

    // ======================================================
    // VALIDATE ANSWERS
    // ======================================================

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: "Please provide an answers array",
        statusCode: 400,
      });
    }

    // ======================================================
    // VALIDATE QUIZ ID
    // ======================================================

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid quiz ID",
        statusCode: 400,
      });
    }

    // ======================================================
    // FIND QUIZ
    // ======================================================

    const quiz = await Quiz.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    // ======================================================
    // CHECK QUIZ
    // ======================================================

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: "Quiz not found",
        statusCode: 404,
      });
    }

    // ======================================================
    // CHECK IF ALREADY COMPLETED
    // ======================================================

    if (quiz.completedAt) {
      return res.status(400).json({
        success: false,
        error: "Quiz already completed",
        statusCode: 400,
      });
    }

    // ======================================================
    // PROCESS ANSWERS
    // ======================================================

    let correctCount = 0;

    const userAnswers = [];

    answers.forEach((answer) => {
      const questionIndex = Number(answer.questionIndex);
      const selectedAnswer = Number(answer.selectedAnswer);

      // ====================================================
      // VALIDATE QUESTION INDEX
      // ====================================================

      if (
        !Number.isInteger(questionIndex) ||
        questionIndex < 0 ||
        questionIndex >= quiz.questions.length
      ) {
        return;
      }

      // ====================================================
      // VALIDATE SELECTED OPTION
      // ====================================================

      if (
        !Number.isInteger(selectedAnswer) ||
        selectedAnswer < 0 ||
        selectedAnswer > 3
      ) {
        return;
      }

      const question = quiz.questions[questionIndex];

      // ====================================================
      // CONVERT CORRECT ANSWER TO NUMBER
      // ====================================================

      const correctAnswer = Number(question.correctAnswer);

      // ====================================================
      // CHECK CORRECT ANSWER
      // ====================================================

      const isCorrect = selectedAnswer === correctAnswer;

      if (isCorrect) {
        correctCount++;
      }

      // ====================================================
      // SAVE USER ANSWER
      // ====================================================

      userAnswers.push({
        questionIndex,
        selectedAnswer,
        isCorrect,
        answeredAt: new Date(),
      });
    });

    // ======================================================
    // MAKE SURE ALL QUESTIONS WERE ANSWERED
    // ======================================================

    if (userAnswers.length !== quiz.questions.length) {
      return res.status(400).json({
        success: false,
        error: "Please answer all questions before submitting.",
        statusCode: 400,
      });
    }

    // ======================================================
    // CALCULATE SCORE
    // ======================================================

    const score =
      quiz.totalQuestions > 0
        ? Math.round((correctCount / quiz.totalQuestions) * 100)
        : 0;

    // ======================================================
    // UPDATE QUIZ
    // ======================================================

    quiz.userAnswers = userAnswers;
    quiz.score = score;
    quiz.completedAt = new Date();

    // ======================================================
    // SAVE QUIZ
    // ======================================================

    await quiz.save();

    // ======================================================
    // RESPONSE
    // ======================================================

    return res.status(200).json({
      success: true,

      data: {
        quizId: quiz._id,
        score,
        correctCount,
        totalQuestions: quiz.totalQuestions,
        percentage: score,
        userAnswers,
      },

      message: "Quiz submitted successfully",

      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

// ==================================================
// GET QUIZ RESULTS
// GET /api/quizzes/:id/results
// PRIVATE
// ==================================================

export const getQuizResults = async (req, res, next) => {
  try {
    const { id } = req.params;

    // ==========================================
    // VALIDATE QUIZ ID
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid quiz ID",
        statusCode: 400,
      });
    }

    // ==========================================
    // FIND QUIZ
    // ==========================================

    const quiz = await Quiz.findOne({
      _id: id,
      userId: req.user._id,
    }).populate("documentId", "title");

    // ==========================================
    // CHECK QUIZ
    // ==========================================

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: "Quiz not found",
        statusCode: 404,
      });
    }

    // ==========================================
    // CHECK COMPLETION
    // ==========================================

    if (!quiz.completedAt) {
      return res.status(400).json({
        success: false,
        error: "Quiz not completed yet",
        statusCode: 400,
      });
    }

    // ==========================================
    // BUILD DETAILED RESULTS
    // ==========================================

    const detailedResults = quiz.questions.map((question, index) => {
      // Find user's answer for this question
      const userAnswer = quiz.userAnswers.find(
        (answer) => answer.questionIndex === index,
      );

      return {
        questionIndex: index,

        question: question.question,

        options: question.options,

        correctAnswer: question.correctAnswer,

        selectedAnswer: userAnswer?.selectedAnswer ?? null,

        isCorrect: userAnswer?.isCorrect ?? false,

        explanation: question.explanation,

        difficulty: question.difficulty,
      };
    });

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,

      data: {
        quiz: {
          id: quiz._id,

          title: quiz.title,

          document: quiz.documentId,

          score: quiz.score,

          totalQuestions: quiz.totalQuestions,

          completedAt: quiz.completedAt,
        },

        results: detailedResults,
      },

      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

// ==================================================
// DELETE QUIZ
// DELETE /api/quizzes/:id
// PRIVATE
// ==================================================

export const deleteQuiz = async (req, res, next) => {
  try {
    const { id } = req.params;

    // ==========================================
    // VALIDATE QUIZ ID
    // ==========================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid quiz ID",
        statusCode: 400,
      });
    }

    // ==========================================
    // FIND QUIZ
    // ==========================================

    const quiz = await Quiz.findOne({
      _id: id,
      userId: req.user._id,
    });

    // ==========================================
    // CHECK QUIZ
    // ==========================================

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: "Quiz not found",
        statusCode: 404,
      });
    }

    // ==========================================
    // DELETE
    // ==========================================

    await quiz.deleteOne();

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "Quiz deleted successfully",
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};
