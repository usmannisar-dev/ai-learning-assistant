import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    // ========================================
    // USER WHO OWNS THE DOCUMENT
    // ========================================

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ========================================
    // DOCUMENT TITLE
    // ========================================

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    // ========================================
    // ORIGINAL FILE NAME
    // ========================================

    fileName: {
      type: String,
      required: true,
      trim: true,
    },

    // ========================================
    // FILE PATH
    // ========================================

    filePath: {
      type: String,
      required: true,
      trim: true,
    },

    // ========================================
    // FILE SIZE
    // ========================================

    fileSize: {
      type: Number,
      required: true,
      min: 0,
    },

    // ========================================
    // NUMBER OF PDF PAGES
    // ========================================

    numPages: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ========================================
    // EXTRACTED PDF TEXT
    // ========================================

    extractedText: {
      type: String,
      default: "",
    },

    // ========================================
    // TEXT CHUNKS
    // ========================================

    chunks: [
      {
        content: {
          type: String,
          required: true,
        },

        pageNumber: {
          type: Number,
          default: 0,
          min: 0,
        },

        chunkIndex: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    // ========================================
    // UPLOAD DATE
    // ========================================

    uploadDate: {
      type: Date,
      default: Date.now,
    },

    // ========================================
    // LAST ACCESSED
    // ========================================

    lastAccessed: {
      type: Date,
      default: Date.now,
    },

    // ========================================
    // PROCESSING STATUS
    // ========================================

    status: {
      type: String,
      enum: ["processing", "ready", "failed"],
      default: "processing",
    },
  },
  {
    timestamps: true,
  },
);

// ========================================
// INDEX
// ========================================

documentSchema.index({
  userId: 1,
  uploadDate: -1,
});

// ========================================
// MODEL
// ========================================

const Document =
  mongoose.models.Document || mongoose.model("Document", documentSchema);

export default Document;
