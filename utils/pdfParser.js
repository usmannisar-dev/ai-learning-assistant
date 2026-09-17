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
    // Read PDF file
    const dataBuffer = await fs.readFile(filePath);

    // Create PDF parser
    parser = new PDFParse({
      data: new Uint8Array(dataBuffer),
      CanvasFactory,
    });

    // Extract text
    const data = await parser.getText();

    return {
      text: data.text || "",
      numPages: data.total || data.numPages || 0,
      info: data.info || {},
    };
  } catch (error) {
    console.error("PDF Parsing Error:", error);

    throw new Error("Failed to extract text from PDF");
  } finally {
    // Always clean up the parser
    if (parser) {
      await parser.destroy().catch(() => {});
    }
  }
};
