import multer from "multer";
import path from "path";
import os from "os";
import fs from "fs";

// ========================================
// UPLOAD DIRECTORY
// ========================================
//
// Vercel Functions cannot write to the deployed
// application directory.
//
// /tmp is writable during a serverless invocation.
//

const uploadDir = process.env.VERCEL
  ? path.join(os.tmpdir(), "ai-learning-uploads")
  : path.join(process.cwd(), "uploads", "documents");

// Create the temporary directory on Vercel
if (process.env.VERCEL) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ========================================
// STORAGE
// ========================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);

    const extension = path.extname(file.originalname);

    cb(null, `document-${uniqueSuffix}${extension}`);
  },
});

// ========================================
// FILE FILTER
// ========================================

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed!"), false);
  }
};

// ========================================
// MULTER
// ========================================

const upload = multer({
  storage,

  fileFilter,

  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024,
  },
});

export default upload;
