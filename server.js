// ============================================================
// LOAD ENVIRONMENT VARIABLES
// ============================================================

import "dotenv/config";

// ============================================================
// IMPORT PACKAGES
// ============================================================

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// ============================================================
// IMPORT MIDDLEWARE
// ============================================================

import errorHandler from "./middleware/errorHandler.js";

// ============================================================
// IMPORT DATABASE
// ============================================================

import connectDB from "./config/db.js";

// ============================================================
// IMPORT ROUTES
// ============================================================

import authRoutes from "./routes/authRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import flashcardRoutes from "./routes/flashcardRoutes.js";
import progressRoutes from "./routes/progressRoute.js";
import quizRoutes from "./routes/quizRoutes.js";

// ============================================================
// ES MODULE __dirname
// ============================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// EXPRESS APP
// ============================================================

const app = express();

// ============================================================
// CORS
// ============================================================

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: ["Content-Type", "Authorization"],

    credentials: true,
  }),
);

// ============================================================
// BODY PARSER
// ============================================================

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  }),
);

// ============================================================
// STATIC UPLOADS
// ============================================================

// LOCAL DEVELOPMENT ONLY FOR NOW.
// WE WILL MOVE PDF STORAGE TO CLOUD STORAGE.

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AI Learning Assistant API is running",
    status: "OK",
  });
});

// ============================================================
// DATABASE CONNECTION
// ============================================================

// CONNECT TO MONGODB BEFORE API REQUESTS.
//
// IMPORTANT:
// YOUR connectDB() FUNCTION USES A CONNECTION CACHE,
// SO WARM VERCEL INSTANCES CAN REUSE THE CONNECTION.

app.use(async (req, res, next) => {
  // SKIP DATABASE CONNECTION FOR THE HEALTH CHECK.
  if (req.path === "/") {
    return next();
  }

  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

// ============================================================
// API ROUTES
// ============================================================

app.use("/api/auth", authRoutes);

app.use("/api/documents", documentRoutes);

app.use("/api/ai", aiRoutes);

app.use("/api/flashcards", flashcardRoutes);

app.use("/api/progress", progressRoutes);

app.use("/api/quizzes", quizRoutes);

// ============================================================
// 404 ROUTE
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.originalUrl}`,
    statusCode: 404,
  });
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use(errorHandler);

// ============================================================
// LOCAL DEVELOPMENT SERVER
// ============================================================

// VERCEL DOES NOT USE app.listen().
//
// LOCALLY:
// npm run dev
//
// VERCEL:
// EXPORTS THE EXPRESS APP.

if (!process.env.VERCEL) {
  const PORT = Number(process.env.PORT) || 8000;

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
}

// ============================================================
// EXPORT EXPRESS APP FOR VERCEL
// ============================================================

export default app;
