import fs from "fs/promises";
import { CanvasFactory } from "pdf-parse/worker";
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
  let parser;

  try {
    // ========================================
    // READ PDF FILE
    // ========================================

    const dataBuffer = await fs.readFile(filePath);

    // ========================================
    // CREATE PDF PARSER
    // ========================================

    parser = new PDFParse({
      data: new Uint8Array(dataBuffer),
      CanvasFactory,
    });

    // ========================================
    // EXTRACT TEXT
    // ========================================

    const data = await parser.getText();

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
  } finally {
    // ========================================
    // CLEANUP
    // ========================================

    if (parser) {
      await parser.destroy?.();
    }
  }
};
