import express from "express";

import {
  uploadDocument,
  getDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
} from "../controllers/documentController.js";

import protect from "../middleware/auth.js";
import upload from "../config/multer.js";

const router = express.Router();

// ==================================================
// PROTECT ALL DOCUMENT ROUTES
// ==================================================
// USER MUST BE LOGGED IN TO ACCESS ANY DOCUMENT API
// ==================================================

router.use(protect);

// ==================================================
// UPLOAD PDF DOCUMENT
// POST /api/documents/upload
// ==================================================
// FIELD NAME FROM FRONTEND MUST BE: "file"
// ==================================================

router.post("/upload", upload.single("file"), uploadDocument);

// ==================================================
// GET ALL DOCUMENTS
// GET /api/documents
// ==================================================

router.get("/", getDocuments);

// ==================================================
// GET SINGLE DOCUMENT
// GET /api/documents/:id
// ==================================================

router.get("/:id", getDocument);

// ==================================================
// UPDATE DOCUMENT TITLE
// PUT/PATCH /api/documents/:id
// ==================================================

router.put("/:id", updateDocument);

router.patch("/:id", updateDocument);

// ==================================================
// DELETE DOCUMENT
// DELETE /api/documents/:id
// ==================================================

router.delete("/:id", deleteDocument);

// ==================================================
// EXPORT ROUTER
// ==================================================

export default router;
