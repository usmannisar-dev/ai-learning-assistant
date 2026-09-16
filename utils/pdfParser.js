import fs from "fs/promises";
import { PDFParse } from "pdf-parse";

/**
 * Extract text from PDF.
 *
 * @param {string} filePath
 * @returns {Promise<{
 *   text: string,
 *   numPages: number,
 *   info?: object
 * }>}
 */

export const extractTextFromPDF = async (filePath) => {
  try {
    // ========================================
    // READ PDF FILE
    // ========================================

    const dataBuffer = await fs.readFile(filePath);

    // ========================================
    // CREATE PDF PARSER
    // ========================================

    const parser = new PDFParse(new Uint8Array(dataBuffer));

    // ========================================
    // EXTRACT TEXT
    // ========================================

    const data = await parser.getText();

    // ========================================
    // CLEANUP PARSER
    // ========================================

    await parser.destroy?.();

    // ========================================
    // RETURN
    // ========================================

    return {
      text: data.text || "",
      numPages: data.numPages || 0,
      info: data.info || {},
    };
  } catch (error) {
    console.error("PDF Parsing Error:", error);

    throw new Error("Failed to extract text from PDF");
  }
};
