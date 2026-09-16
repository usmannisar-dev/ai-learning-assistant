import mongoose from "mongoose";

import Document from "../models/Document.js";
import Flashcard from "../models/Flashcard.js";
import Quiz from "../models/Quiz.js";
import ChatHistory from "../models/ChatHistory.js";

import * as geminiService from "../utils/geminiService.js";

import { findRelevantChunks } from "../utils/textChunker.js";

// ==================================================
// HELPER: GET READY DOCUMENT
// ==================================================

const getReadyDocument = async (documentId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(documentId)) {
    return null;
  }

  return Document.findOne({
    _id: documentId,

    userId,

    status: "ready",
  });
};

// ==================================================
// GENERATE FLASHCARDS
// POST /api/ai/generate-flashcards
// PRIVATE
// ==================================================

export const generateFlashcards = async (req, res, next) => {
  try {
    const { documentId, count = 10 } = req.body;

    // ========================================
    // VALIDATION
    // ========================================

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: "Please provide documentId",
        statusCode: 400,
      });
    }

    // ========================================
    // FIND DOCUMENT
    // ========================================

    const document = await getReadyDocument(documentId, req.user._id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found or not ready",
        statusCode: 404,
      });
    }

    // ========================================
    // GENERATE FLASHCARDS
    // ========================================

    const cards = await geminiService.generateFlashcards(
      document.extractedText,
      Number(count),
    );

    if (cards.length === 0) {
      return res.status(502).json({
        success: false,
        error: "AI did not generate any valid flashcards",
        statusCode: 502,
      });
    }

    // ========================================
    // SAVE FLASHCARD SET
    // ========================================

    const flashcardSet = await Flashcard.create({
      userId: req.user._id,
      documentId: document._id,

      title: `${document.title} Flashcards`,

      cards: cards.map((card) => ({
        question: card.question,
        answer: card.answer,
        difficulty: card.difficulty,
        reviewCount: 0,
        isStarred: false,
        lastReviewed: null,
      })),
    });

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(201).json({
      success: true,

      data: flashcardSet,

      message: "Flashcards generated successfully",

      statusCode: 201,
    });
  } catch (error) {
    next(error);
  }
};

// ==================================================
// GENERATE QUIZ
// POST /api/ai/generate-quiz
// PRIVATE
// ==================================================

export const generateQuiz = async (req, res, next) => {
  try {
    const { documentId, numQuestions = 5, title } = req.body;

    // ========================================
    // VALIDATE
    // ========================================

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: "Please provide documentId",
        statusCode: 400,
      });
    }

    const document = await getReadyDocument(documentId, req.user._id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found or not ready",
        statusCode: 404,
      });
    }

    // ========================================
    // GENERATE QUIZ USING GEMINI
    // ========================================

    const questions = await geminiService.generateQuiz(
      document.extractedText,
      Number(numQuestions),
    );

    if (questions.length === 0) {
      return res.status(502).json({
        success: false,
        error: "AI did not generate valid quiz questions",
        statusCode: 502,
      });
    }

    // ========================================
    // SAVE QUIZ
    // ========================================

    const quiz = await Quiz.create({
      userId: req.user._id,

      documentId: document._id,

      title: title?.trim() || `${document.title} Quiz`,

      questions,

      totalQuestions: questions.length,

      score: 0,

      userAnswers: [],
    });

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(201).json({
      success: true,

      data: quiz,

      message: "Quiz generated successfully",

      statusCode: 201,
    });
  } catch (error) {
    next(error);
  }
};

// ==================================================
// GENERATE SUMMARY
// POST /api/ai/generate-summary
// PRIVATE
// ==================================================

export const generateSummary = async (req, res, next) => {
  try {
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: "Please provide documentId",
        statusCode: 400,
      });
    }

    const document = await getReadyDocument(documentId, req.user._id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found or not ready",
        statusCode: 404,
      });
    }

    // ========================================
    // GENERATE SUMMARY
    // ========================================

    const summary = await geminiService.generateSummary(document.extractedText);

    return res.status(200).json({
      success: true,

      data: {
        documentId: document._id,

        title: document.title,

        summary,
      },

      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

// ==================================================
// CHAT WITH DOCUMENT
// POST /api/ai/chat
// PRIVATE
// ==================================================

export const chat = async (req, res, next) => {
  try {
    const { documentId, question } = req.body;

    // ========================================
    // VALIDATION
    // ========================================

    if (!documentId || !question || !question.trim()) {
      return res.status(400).json({
        success: false,
        error: "documentId and question are required",
        statusCode: 400,
      });
    }

    // ========================================
    // FIND DOCUMENT
    // ========================================

    const document = await getReadyDocument(documentId, req.user._id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found or not ready",
        statusCode: 404,
      });
    }

    // ========================================
    // FIND RELEVANT CHUNKS
    // ========================================

    const relevantChunks = findRelevantChunks(document.chunks, question, 5);

    if (relevantChunks.length === 0) {
      return res.status(200).json({
        success: true,

        data: {
          question,

          answer:
            "I couldn't find enough relevant information in the document to answer that question.",

          relevantChunks: [],
        },

        statusCode: 200,
      });
    }

    // ========================================
    // ASK GEMINI
    // ========================================

    const answer = await geminiService.chatWithContext(
      question,
      relevantChunks,
    );

    // ========================================
    // GET RELEVANT CHUNK INDEXES
    // ========================================

    const relevantChunkIndexes = relevantChunks.map(
      (chunk) => chunk.chunkIndex,
    );

    // ========================================
    // FIND EXISTING CHAT HISTORY
    // ========================================

    let chatHistory = await ChatHistory.findOne({
      userId: req.user._id,
      documentId: document._id,
    });

    // ========================================
    // CREATE CHAT HISTORY IF NOT EXISTS
    // ========================================

    if (!chatHistory) {
      chatHistory = await ChatHistory.create({
        userId: req.user._id,
        documentId: document._id,
        messages: [],
      });
    }

    // ========================================
    // ADD USER MESSAGE
    // ========================================

    chatHistory.messages.push({
      role: "user",

      content: question,

      timestamp: new Date(),

      relevantChunks: [],
    });

    // ========================================
    // ADD ASSISTANT MESSAGE
    // ========================================

    chatHistory.messages.push({
      role: "assistant",

      content: answer,

      timestamp: new Date(),

      relevantChunks: relevantChunkIndexes,
    });

    // ========================================
    // SAVE CHAT HISTORY
    // ========================================

    await chatHistory.save();

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(200).json({
      success: true,

      data: {
        question,

        answer,

        relevantChunks,

        chatHistoryId: chatHistory._id,
      },

      message: "Response Generated Successfully",

      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

// ==================================================
// EXPLAIN CONCEPT
// POST /api/ai/explain-concept
// PRIVATE
// ==================================================

export const explainConcept = async (req, res, next) => {
  try {
    const { documentId, concept } = req.body;

    if (!documentId || !concept || !concept.trim()) {
      return res.status(400).json({
        success: false,

        error: "documentId and concept are required",

        statusCode: 400,
      });
    }

    // ========================================
    // FIND DOCUMENT
    // ========================================

    const document = await getReadyDocument(documentId, req.user._id);

    if (!document) {
      return res.status(404).json({
        success: false,

        error: "Document not found or not ready",

        statusCode: 404,
      });
    }

    // ========================================
    // FIND RELEVANT CONTEXT
    // ========================================

    const relevantChunks = findRelevantChunks(document.chunks, concept, 5);

    const context =
      relevantChunks.length > 0
        ? relevantChunks.map((chunk) => chunk.content).join("\n\n")
        : document.extractedText.substring(0, 10000);

    // ========================================
    // GENERATE EXPLANATION ASK GEMINI
    // ========================================

    const explanation = await geminiService.explainConcept(concept, context);

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(200).json({
      success: true,

      data: {
        concept,

        explanation,

        relevantChunks,
      },

      message: "Explanation generated successfully",

      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

// ==================================================
// GET CHAT HISTORY
// GET /api/ai/chat-history/:documentId
// PRIVATE
// ==================================================

export const getChatHistory = async (req, res, next) => {
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
    // VERIFY DOCUMENT OWNERSHIP
    // ========================================

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
    }).select("_id");

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found",
        statusCode: 404,
      });
    }

    // ========================================
    // GET CHAT HISTORY
    // ========================================

    const history = await ChatHistory.findOne({
      userId: req.user._id,
      documentId: document._id,
    });

    // ========================================
    // NO CHAT HISTORY
    // ========================================

    if (!history) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        statusCode: 200,
      });
    }

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(200).json({
      success: true,

      count: history.messages.length,

      data: history.messages,

      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};
