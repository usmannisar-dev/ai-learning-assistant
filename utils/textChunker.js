/**
 * Split extracted PDF text into chunks.
 *
 * Each chunk matches the Document model:
 *
 * {
 *   content: String,
 *   chunkIndex: Number,
 *   pageNumber: Number
 * }
 *
 * @param {string} text
 * @param {number} chunkSize - Maximum words per chunk
 * @param {number} overlap - Words shared between chunks
 * @returns {Array<{
 *   content: string,
 *   chunkIndex: number,
 *   pageNumber: number
 * }>}
 */

export const chunkText = (text, chunkSize = 500, overlap = 50) => {
  // ========================================
  // VALIDATION
  // ========================================

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return [];
  }

  if (chunkSize <= 0) {
    throw new Error("chunkSize must be greater than 0");
  }

  if (overlap < 0) {
    throw new Error("overlap cannot be negative");
  }

  if (overlap >= chunkSize) {
    throw new Error("overlap must be smaller than chunkSize");
  }

  // ========================================
  // CLEAN TEXT
  // ========================================

  const cleanedText = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // ========================================
  // SPLIT INTO PARAGRAPHS
  // ========================================

  const paragraphs = cleanedText
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  // ========================================
  // RESULT
  // ========================================

  const chunks = [];

  let chunkIndex = 0;

  // ========================================
  // CURRENT CHUNK
  // ========================================

  let currentWords = [];

  // ========================================
  // PROCESS EACH PARAGRAPH
  // ========================================

  for (const paragraph of paragraphs) {
    const paragraphWords = paragraph.split(/\s+/);

    // ========================================
    // LARGE PARAGRAPH
    // ========================================

    if (paragraphWords.length > chunkSize) {
      // --------------------------------
      // Save current chunk first
      // --------------------------------

      if (currentWords.length > 0) {
        chunks.push({
          content: currentWords.join(" "),
          chunkIndex,
          pageNumber: 1,
        });

        chunkIndex++;

        currentWords = [];
      }

      // --------------------------------
      // Split large paragraph
      // --------------------------------

      const step = chunkSize - overlap;

      for (let i = 0; i < paragraphWords.length; i += step) {
        const chunkWords = paragraphWords.slice(i, i + chunkSize);

        if (chunkWords.length === 0) {
          continue;
        }

        chunks.push({
          content: chunkWords.join(" "),
          chunkIndex,
          pageNumber: 1,
        });

        chunkIndex++;

        // --------------------------------
        // Stop when final chunk reached
        // --------------------------------

        if (i + chunkSize >= paragraphWords.length) {
          break;
        }
      }

      continue;
    }

    // ========================================
    // CHECK IF PARAGRAPH FITS
    // ========================================

    if (currentWords.length + paragraphWords.length > chunkSize) {
      // --------------------------------
      // Save current chunk
      // --------------------------------

      if (currentWords.length > 0) {
        chunks.push({
          content: currentWords.join(" "),
          chunkIndex,
          pageNumber: 1,
        });

        chunkIndex++;
      }

      // --------------------------------
      // Create overlap
      // --------------------------------

      const overlapWords = currentWords.slice(-overlap);

      currentWords = [...overlapWords, ...paragraphWords];

      // --------------------------------
      // If overlap + paragraph itself is
      // still too large, trim it
      // --------------------------------

      if (currentWords.length > chunkSize) {
        currentWords = currentWords.slice(0, chunkSize);
      }
    } else {
      // ========================================
      // ADD PARAGRAPH TO CURRENT CHUNK
      // ========================================

      currentWords.push(...paragraphWords);
    }
  }

  // ========================================
  // SAVE FINAL CHUNK
  // ========================================

  if (currentWords.length > 0) {
    chunks.push({
      content: currentWords.join(" "),
      chunkIndex,
      pageNumber: 1,
    });
  }

  // ========================================
  // RETURN
  // ========================================

  return chunks;
};

/**
 * Find relevant chunks using keyword matching.
 *
 * This is a temporary/simple retrieval system.
 * Later you can replace it with embeddings + vector search.
 *
 * @param {Array<Object>} chunks
 * @param {string} query
 * @param {number} maxChunks
 * @returns {Array<Object>}
 */

export const findRelevantChunks = (chunks, query, maxChunks = 3) => {
  // ========================================
  // VALIDATION
  // ========================================

  if (
    !Array.isArray(chunks) ||
    chunks.length === 0 ||
    !query ||
    query.trim().length === 0
  ) {
    return [];
  }

  // ========================================
  // STOP WORDS
  // ========================================

  const stopWords = new Set([
    "the",
    "is",
    "at",
    "which",
    "on",
    "an",
    "and",
    "or",
    "but",
    "in",
    "with",
    "to",
    "for",
    "of",
    "as",
    "by",
    "this",
    "that",
    "it",
    "are",
    "was",
    "were",
    "be",
    "been",
    "from",
    "what",
    "how",
    "why",
    "when",
    "where",
    "who",
  ]);

  // ========================================
  // CLEAN QUERY
  // ========================================

  const queryWords = query
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));

  // ========================================
  // NO USEFUL QUERY WORDS
  // ========================================

  if (queryWords.length === 0) {
    return chunks.slice(0, maxChunks).map((chunk) => ({
      content: chunk.content,
      chunkIndex: chunk.chunkIndex,
      pageNumber: chunk.pageNumber,
      _id: chunk._id,
    }));
  }

  // ========================================
  // SCORE CHUNKS
  // ========================================

  const scoredChunks = chunks.map((chunk, index) => {
    const content = String(chunk.content || "").toLowerCase();

    const contentWords = content.split(/\s+/).filter(Boolean);

    let score = 0;

    let matchedWords = 0;

    // ========================================
    // SCORE EACH QUERY WORD
    // ========================================

    for (const word of queryWords) {
      // --------------------------------
      // Escape regex characters
      // --------------------------------

      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      // --------------------------------
      // Exact word matches
      // --------------------------------

      const exactMatches = (
        content.match(new RegExp(`\\b${escapedWord}\\b`, "g")) || []
      ).length;

      // --------------------------------
      // Partial matches
      // --------------------------------

      const partialMatches = (content.match(new RegExp(escapedWord, "g")) || [])
        .length;

      // --------------------------------
      // Score
      // --------------------------------

      score += exactMatches * 3;

      score += Math.max(0, partialMatches - exactMatches);

      // --------------------------------
      // Count unique matched words
      // --------------------------------

      if (new RegExp(`\\b${escapedWord}\\b`).test(content)) {
        matchedWords++;
      }
    }

    // ========================================
    // BONUS FOR MULTIPLE MATCHED WORDS
    // ========================================

    if (matchedWords > 1) {
      score += matchedWords * 2;
    }

    // ========================================
    // NORMALIZE SCORE
    // ========================================

    const normalizedScore =
      contentWords.length > 0 ? score / Math.sqrt(contentWords.length) : 0;

    // ========================================
    // SMALL POSITION BONUS
    // ========================================

    const positionBonus = 1 - (index / Math.max(chunks.length, 1)) * 0.1;

    // ========================================
    // RETURN RESULT
    // ========================================

    return {
      content: chunk.content,
      chunkIndex: chunk.chunkIndex,
      pageNumber: chunk.pageNumber,
      _id: chunk._id,

      score: normalizedScore * positionBonus,

      rawScore: score,

      matchedWords,
    };
  });

  // ========================================
  // SORT + LIMIT
  // ========================================

  return scoredChunks
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => {
      // Highest score first
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      // More matched words first
      if (b.matchedWords !== a.matchedWords) {
        return b.matchedWords - a.matchedWords;
      }

      // Earlier chunks first
      return a.chunkIndex - b.chunkIndex;
    })
    .slice(0, maxChunks);
};
