import mongoose from "mongoose";

const quizSchema = new mongoose.Schema(
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

    questions: [
      {
        question: {
          type: String,
          required: true,
          trim: true,
        },

        options: {
          type: [String],
          required: true,

          validate: {
            validator: function (array) {
              return array.length === 4;
            },

            message: "Must have exactly 4 options",
          },
        },

        correctAnswer: {
          type: String,
          required: true,
          trim: true,
        },

        explanation: {
          type: String,
          default: "",
          trim: true,
        },

        difficulty: {
          type: String,
          enum: ["easy", "medium", "hard"],
          default: "medium",
        },
      },
    ],

    userAnswers: [
      {
        questionIndex: {
          type: Number,
          required: true,
          min: 0,
        },

        selectedAnswer: {
          type: Number,
          required: true,
          min: 0,
          max: 3,
        },

        isCorrect: {
          type: Boolean,
          required: true,
        },

        answeredAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    score: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Faster queries
quizSchema.index({
  userId: 1,
  documentId: 1,
});

// Prevent OverwriteModelError
const Quiz = mongoose.models.Quiz || mongoose.model("Quiz", quizSchema);

export default Quiz;
