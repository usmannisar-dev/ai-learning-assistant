import mongoose from "mongoose";

const chatHistorySchema = new mongoose.Schema(
  {
    // ========================================
    // USER
    // ========================================

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ========================================
    // DOCUMENT
    // ========================================

    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },

    // ========================================
    // CHAT MESSAGES
    // ========================================

    messages: [
      {
        role: {
          type: String,
          enum: ["user", "assistant"],
          required: true,
        },

        content: {
          type: String,
          required: true,
          trim: true,
        },

        timestamp: {
          type: Date,
          default: Date.now,
        },

        // Which document chunks were used
        // to answer this message
        relevantChunks: {
          type: [Number],
          default: [],
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

// ========================================
// INDEX
// ========================================

chatHistorySchema.index({
  userId: 1,
  documentId: 1,
});

// ========================================
// MODEL
// ========================================

const ChatHistory =
  mongoose.models.ChatHistory ||
  mongoose.model("ChatHistory", chatHistorySchema);

export default ChatHistory;
