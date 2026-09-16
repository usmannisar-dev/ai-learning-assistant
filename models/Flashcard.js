import mongoose from "mongoose";

const flashcardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    cards: [
      {
        question: {
          type: String,
          required: true,
          trim: true,
        },

        answer: {
          type: String,
          required: true,
          trim: true,
        },

        difficulty: {
          type: String,
          enum: ["easy", "medium", "hard"],
          default: "medium",
        },

        isStarred: {
          type: Boolean,
          default: false,
        },

        reviewCount: {
          type: Number,
          default: 0,
          min: 0,
        },

        lastReviewed: {
          type: Date,
          default: null,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Faster queries
flashcardSchema.index({
  userId: 1,
  documentId: 1,
});

// Prevent OverwriteModelError
const Flashcard =
  mongoose.models.Flashcard || mongoose.model("Flashcard", flashcardSchema);

export default Flashcard;
