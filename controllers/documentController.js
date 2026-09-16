import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import Document from "../models/Document.js";
import Flashcard from "../models/Flashcard.js";
import Quiz from "../models/Quiz.js";
import ChatHistory from "../models/ChatHistory.js";

import { extractTextFromPDF } from "../utils/pdfParser.js";

import { chunkText } from "../utils/textChunker.js";

// ========================================
// __dirname FOR ES MODULES
// ========================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========================================
// UPLOAD DIRECTORY
// ========================================

const uploadDir = path.join(__dirname, "../uploads/documents");

// ==================================================
// @desc    Upload PDF Document
// @route   POST /api/documents/upload
// @access  Private
// ==================================================

export const uploadDocument = async (req, res, next) => {
  try {
    // ========================================
    // CHECK FILE
    // ========================================

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Please upload a PDF file",
        statusCode: 400,
      });
    }

    // ========================================
    // GET TITLE
    // ========================================

    const { title } = req.body;

    if (!title || !title.trim()) {
      // Remove uploaded file because request is invalid
      await fs.unlink(req.file.path).catch(() => {});

      return res.status(400).json({
        success: false,
        error: "Please provide a document title",
        statusCode: 400,
      });
    }

    // ========================================
    // BUILD PUBLIC FILE URL
    // ========================================

    const fileUrl = `/uploads/documents/${req.file.filename}`;

    // ========================================
    // CREATE DOCUMENT
    // ========================================

    const document = await Document.create({
      userId: req.user._id,

      title: title.trim(),

      fileName: req.file.originalname,

      filePath: fileUrl,

      fileSize: req.file.size,

      status: "processing",
    });

    // ========================================
    // PROCESS PDF
    // ========================================

    processPDF(document._id, req.file.path).catch((error) => {
      console.error("PDF processing error:", error);
    });

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(201).json({
      success: true,

      message: "Document uploaded successfully. Processing in progress...",

      data: document,

      statusCode: 201,
    });
  } catch (error) {
    // ========================================
    // CLEAN UP UPLOADED FILE ON ERROR
    // ========================================

    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    next(error);
  }
};

// ==================================================
// PROCESS PDF HELPER
// ==================================================

const processPDF = async (documentId, filePath) => {
  try {
    console.log(`Processing document: ${documentId}`);

    // ========================================
    // EXTRACT TEXT
    // ========================================

    const { text, numPages } = await extractTextFromPDF(filePath);

    // ========================================
    // CHECK EXTRACTED TEXT
    // ========================================

    if (!text || !text.trim()) {
      throw new Error("No text could be extracted from PDF");
    }

    // ========================================
    // CHUNK TEXT
    // ========================================

    const chunks = chunkText(text, 500, 50);

    // ========================================
    // UPDATE DOCUMENT
    // ========================================

    await Document.findByIdAndUpdate(
      documentId,
      {
        extractedText: text,

        chunks,

        numPages,

        status: "ready",
      },
      {
        new: true,
      },
    );

    console.log(`Document ${documentId} processed successfully`);
  } catch (error) {
    console.error(`Error processing document ${documentId}:`, error);

    // ========================================
    // MARK AS FAILED
    // ========================================

    await Document.findByIdAndUpdate(documentId, {
      status: "failed",
    });

    throw error;
  }
};

// ==================================================
// @desc    Get All Documents For Logged-In User
// @route   GET /api/documents
// @access  Private
// ==================================================

export const getDocuments = async (req, res, next) => {
  try {
    // ========================================
    // GET DOCUMENTS
    // ========================================

    const documents = await Document.aggregate([
      // --------------------------------
      // Only logged-in user's documents
      // --------------------------------

      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user._id),
        },
      },

      // --------------------------------
      // Flashcards
      // --------------------------------

      {
        $lookup: {
          from: "flashcards",

          localField: "_id",

          foreignField: "documentId",

          as: "flashcardSets",
        },
      },

      // --------------------------------
      // Quizzes
      // --------------------------------

      {
        $lookup: {
          from: "quizzes",

          localField: "_id",

          foreignField: "documentId",

          as: "quizzes",
        },
      },

      // --------------------------------
      // Calculate counts
      // --------------------------------

      {
        $addFields: {
          flashcardCount: {
            $size: "$flashcardSets",
          },

          quizCount: {
            $size: "$quizzes",
          },
        },
      },

      // --------------------------------
      // Hide large/unnecessary properties
      // --------------------------------

      {
        $project: {
          extractedText: 0,
          chunks: 0,
          flashcardSets: 0,
          quizzes: 0,
        },
      },

      // --------------------------------
      // Newest first
      // --------------------------------

      {
        $sort: {
          createdAt: -1,
        },
      },
    ]);

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(200).json({
      success: true,

      count: documents.length,

      data: documents,

      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

// ==================================================
// @desc    Get Single Document
// @route   GET /api/documents/:id
// @access  Private
// ==================================================

export const getDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    // ========================================
    // VALIDATE MONGODB ID
    // ========================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid document ID",
        statusCode: 400,
      });
    }

    // ========================================
    // FIND DOCUMENT
    // ========================================

    const document = await Document.findOne({
      _id: id,
      userId: req.user._id,
    });

    // ========================================
    // NOT FOUND
    // ========================================

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found",
        statusCode: 404,
      });
    }

    document.lastAccessed = new Date();

    await document.save();

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(200).json({
      success: true,
      data: document,
      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

// ==================================================
// @desc    Update Document Title
// @route   PUT /api/documents/:id
// @access  Private
// ==================================================

export const updateDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { title } = req.body;

    // ========================================
    // VALIDATE ID
    // ========================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid document ID",
        statusCode: 400,
      });
    }

    // ========================================
    // VALIDATE TITLE
    // ========================================

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: "Please provide a document title",
        statusCode: 400,
      });
    }

    // ========================================
    // UPDATE DOCUMENT
    // ========================================

    const document = await Document.findOneAndUpdate(
      {
        _id: id,
        userId: req.user._id,
      },
      {
        title: title.trim(),
      },
      {
        new: true,
        runValidators: true,
      },
    );

    // ========================================
    // NOT FOUND
    // ========================================

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found",
        statusCode: 404,
      });
    }

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(200).json({
      success: true,

      message: "Document updated successfully",

      data: document,

      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};

// ==================================================
// @desc    Delete Document
// @route   DELETE /api/documents/:id
// @access  Private
// ==================================================

export const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    // ========================================
    // VALIDATE ID
    // ========================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid document ID",
        statusCode: 400,
      });
    }

    // ========================================
    // FIND DOCUMENT FIRST
    // ========================================

    const document = await Document.findOne({
      _id: id,
      userId: req.user._id,
    });

    // ========================================
    // NOT FOUND
    // ========================================

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found",
        statusCode: 404,
      });
    }

    // ========================================
    // DELETE RELATED FLASHCARDS
    // ========================================

    await Flashcard.deleteMany({
      documentId: document._id,
    });

    // ========================================
    // DELETE RELATED QUIZZES
    // ========================================

    await Quiz.deleteMany({
      documentId: document._id,
    });

    // ========================================
    // DELETE RELATED CHAT HISTORY
    // ========================================

    await ChatHistory.deleteMany({
      documentId: document._id,
    });

    // ========================================
    // DELETE PHYSICAL PDF FILE
    // ========================================

    if (document.filePath) {
      const fileName = path.basename(document.filePath);

      const physicalPath = path.join(uploadDir, fileName);

      await fs.unlink(physicalPath).catch((error) => {
        if (error.code !== "ENOENT") {
          console.error("Error deleting physical file:", error);
        }
      });
    }

    // ========================================
    // DELETE DOCUMENT FROM DATABASE
    // ========================================

    await Document.deleteOne({
      _id: document._id,
    });

    // ========================================
    // RESPONSE
    // ========================================

    return res.status(200).json({
      success: true,

      message: "Document deleted successfully",

      statusCode: 200,
    });
  } catch (error) {
    next(error);
  }
};
