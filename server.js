import "dotenv/config";

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import errorHandler from "./middleware/errorHandler.js";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import flashcardRoutes from "./routes/flashcardRoutes.js";
import progressRoutes from "./routes/progressRoute.js";
import quizRoutes from "./routes/quizRoutes.js";

// ========================================
// ES MODULE __dirname
// ========================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========================================
// EXPRESS APP
// ========================================

const app = express();

// ========================================
// CORS
// ========================================

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],

    allowedHeaders: ["Content-Type", "Authorization"],

    credentials: true,
  }),
);

// ========================================
// BODY PARSER
// ========================================

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  }),
);

// ========================================
// STATIC UPLOADS
// ========================================

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ========================================
// HEALTH CHECK
// ========================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AI Learning Assistant API is running",
    status: "OK",
  });
});

// ========================================
// ROUTES
// ========================================

app.use("/api/auth", authRoutes);

app.use("/api/documents", documentRoutes);

app.use("/api/ai", aiRoutes);

app.use("/api/flashcards", flashcardRoutes);

app.use("/api/progress", progressRoutes);

app.use("/api/quizzes", quizRoutes);

// ========================================
// 404
// ========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.originalUrl}`,
    statusCode: 404,
  });
});

// ========================================
// GLOBAL ERROR HANDLER
// ========================================

app.use(errorHandler);

// ========================================
// PORT
// ========================================

const PORT = Number(process.env.PORT) || 8000;

// ========================================
// START SERVER
// ========================================

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(
        `Server running in ${process.env.NODE_ENV || "development"} mode`,
      );

      console.log(`API: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);

    process.exit(1);
  }
};

startServer();

// ========================================
// UNHANDLED PROMISE REJECTION
// ========================================

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Promise Rejection:", error);

  process.exit(1);
});

// ========================================
// UNCAUGHT EXCEPTION
// ========================================

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);

  process.exit(1);
});
