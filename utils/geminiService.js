import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

// ==================================================
// GEMINI CLIENT
// ==================================================

let aiClient;

const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    const error = new Error("GEMINI_API_KEY is not configured");
    error.statusCode = 500;
    throw error;
  }

  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
    });
  }

  return aiClient;
};

// ==================================================
// MODEL
// ==================================================

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// ==================================================
// HELPER: LIMIT TEXT
// ==================================================

const limitText = (text, maxLength = 15000) => {
  return String(text || "")
    .trim()
    .slice(0, maxLength);
};

// ==================================================
// HELPER: PARSE JSON RESPONSE
// ==================================================

const parseJSONResponse = (text) => {
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  let cleaned = String(text).trim();

  // Remove ```json
  cleaned = cleaned.replace(/^```json\s*/i, "");

  // Remove ```
  cleaned = cleaned.replace(/^```\s*/i, "");

  // Remove closing ```
  cleaned = cleaned.replace(/\s*```$/i, "");

  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("=================================");
    console.error("INVALID GEMINI JSON");
    console.error("=================================");
    console.error("Raw response:");
    console.error(cleaned);

    throw new Error("Gemini returned invalid JSON");
  }
};

// ==================================================
// HELPER: VALIDATE TEXT
// ==================================================

const validateText = (text) => {
  if (!text || typeof text !== "string" || !text.trim()) {
    throw new Error("Document text is required");
  }
};

// ==================================================
// GENERATE FLASHCARDS
// ==================================================
// POST /api/ai/generate-flashcards
// ==================================================

export const generateFlashcards = async (text, count = 10) => {
  try {
    // ========================================
    // VALIDATE INPUT
    // ========================================

    validateText(text);

    // ========================================
    // SAFE COUNT
    // ========================================

    const safeCount = Math.min(Math.max(Number(count) || 10, 1), 30);

    // ========================================
    // DEBUG
    // ========================================

    console.log("=================================");
    console.log("GEMINI FLASHCARD DEBUG");
    console.log("=================================");
    console.log("Model:", MODEL);
    console.log("API key loaded:", Boolean(process.env.GEMINI_API_KEY));
    console.log("Document text length:", text.length);
    console.log("Requested flashcards:", safeCount);

    // ========================================
    // PROMPT
    // ========================================

    const prompt = `
You are an educational AI assistant.

Generate exactly ${safeCount} high-quality
educational flashcards from the document below.

IMPORTANT:
Return ONLY valid JSON.
Do NOT return markdown.
Do NOT return code fences.
Do NOT return explanations outside JSON.

Required JSON format:

[
  {
    "question": "Question here",
    "answer": "Answer here",
    "difficulty": "easy"
  }
]

Rules:

1. Generate exactly ${safeCount} flashcards.
2. Every flashcard must have:
   - question
   - answer
   - difficulty
3. difficulty MUST be one of:
   - "easy"
   - "medium"
   - "hard"
4. Questions must be clear and educational.
5. Answers must be accurate and concise.
6. Use ONLY information contained in the document.
7. Do NOT invent information.
8. Avoid duplicate questions.
9. Cover different important concepts from the document.

DOCUMENT:

${limitText(text, 15000)}
`;

    // ========================================
    // CALL GEMINI
    // ========================================

    console.log("Sending flashcard request to Gemini...");

    const response = await getAIClient().models.generateContent({
      model: MODEL,
      contents: prompt,
    });

    // ========================================
    // RESPONSE DEBUG
    // ========================================

    console.log("Gemini flashcard response received.");

    console.log("Gemini response length:", response.text?.length || 0);

    // ========================================
    // PARSE JSON
    // ========================================

    const flashcards = parseJSONResponse(response.text);

    // ========================================
    // VALIDATE ARRAY
    // ========================================

    if (!Array.isArray(flashcards)) {
      throw new Error("Gemini flashcard response is not an array");
    }

    // ========================================
    // CLEAN FLASHCARDS
    // ========================================

    const cleanedFlashcards = flashcards
      .filter((card) => card && card.question && card.answer)
      .map((card) => {
        const difficulty = String(card.difficulty || "medium")
          .trim()
          .toLowerCase();

        return {
          question: String(card.question).trim(),

          answer: String(card.answer).trim(),

          difficulty: ["easy", "medium", "hard"].includes(difficulty)
            ? difficulty
            : "medium",
        };
      })
      .slice(0, safeCount);

    // ========================================
    // VALIDATE RESULT
    // ========================================

    if (cleanedFlashcards.length === 0) {
      throw new Error("Gemini did not return valid flashcards");
    }

    console.log("Valid flashcards generated:", cleanedFlashcards.length);

    return cleanedFlashcards;
  } catch (error) {
    // ========================================
    // IMPORTANT DEBUG
    // ========================================

    console.error("=================================");
    console.error("GEMINI FLASHCARD ERROR");
    console.error("=================================");

    console.error("Name:", error?.name);

    console.error("Message:", error?.message);

    console.error("Status:", error?.status);

    console.error("Code:", error?.code);

    console.error("Stack:", error?.stack);

    // Do NOT print API key

    throw error;
  }
};

// ==================================================
// GENERATE QUIZ
// ==================================================
// POST /api/ai/generate-quiz
// ==================================================

export const generateQuiz = async (text, numQuestions = 5) => {
  try {
    // ========================================
    // VALIDATE INPUT
    // ========================================

    validateText(text);

    // ========================================
    // SAFE COUNT
    // ========================================

    const safeCount = Math.min(Math.max(Number(numQuestions) || 5, 1), 20);

    // ========================================
    // DEBUG
    // ========================================

    console.log("=================================");
    console.log("GEMINI QUIZ DEBUG");
    console.log("=================================");
    console.log("Model:", MODEL);
    console.log("API key loaded:", Boolean(process.env.GEMINI_API_KEY));
    console.log("Document text length:", text.length);
    console.log("Requested questions:", safeCount);

    // ========================================
    // PROMPT
    // ========================================

    const prompt = `
You are an educational AI assistant.

Generate exactly ${safeCount} multiple-choice
questions from the document below.

Return ONLY valid JSON.
Do NOT return markdown.
Do NOT return code fences.

Required structure:

[
  {
    "question": "Question here",
    "options": [
      "Option 1",
      "Option 2",
      "Option 3",
      "Option 4"
    ],
    "correctAnswer": 0,
    "explanation": "Explanation here",
    "difficulty": "medium"
  }
]

Rules:

1. Generate exactly ${safeCount} questions.
2. Every question must have exactly 4 options.
3. correctAnswer MUST be an integer:
   0, 1, 2, or 3.
4. correctAnswer represents the index
   of the correct option.
5. difficulty MUST be:
   "easy", "medium", or "hard".
6. Provide a clear explanation.
7. Use ONLY information from the document.
8. Do NOT invent information.
9. Avoid duplicate questions.

DOCUMENT:

${limitText(text, 15000)}
`;

    // ========================================
    // CALL GEMINI
    // ========================================

    console.log("Sending quiz request to Gemini...");

    const response = await getAIClient().models.generateContent({
      model: MODEL,
      contents: prompt,
    });

    console.log("Gemini quiz response received.");

    // ========================================
    // PARSE
    // ========================================

    const questions = parseJSONResponse(response.text);

    // ========================================
    // VALIDATE ARRAY
    // ========================================

    if (!Array.isArray(questions)) {
      throw new Error("Gemini quiz response is not an array");
    }

    // ========================================
    // CLEAN QUESTIONS
    // ========================================

    const cleanedQuestions = questions
      .filter((item) => {
        const correctAnswer = Number(item?.correctAnswer);

        return (
          item &&
          item.question &&
          Array.isArray(item.options) &&
          item.options.length === 4 &&
          Number.isInteger(correctAnswer) &&
          correctAnswer >= 0 &&
          correctAnswer <= 3
        );
      })
      .map((item) => {
        const correctAnswer = Number(item.correctAnswer);

        const difficulty = String(item.difficulty || "medium")
          .trim()
          .toLowerCase();

        return {
          question: String(item.question).trim(),

          options: item.options.map((option) => String(option).trim()),

          correctAnswer,

          explanation: String(item.explanation || "").trim(),

          difficulty: ["easy", "medium", "hard"].includes(difficulty)
            ? difficulty
            : "medium",
        };
      })
      .slice(0, safeCount);

    // ========================================
    // VALIDATE
    // ========================================

    if (cleanedQuestions.length === 0) {
      throw new Error("Gemini did not return valid quiz questions");
    }

    console.log("Valid quiz questions generated:", cleanedQuestions.length);

    return cleanedQuestions;
  } catch (error) {
    // ========================================
    // DEBUG
    // ========================================

    console.error("=================================");
    console.error("GEMINI QUIZ ERROR");
    console.error("=================================");

    console.error("Name:", error?.name);

    console.error("Message:", error?.message);

    console.error("Status:", error?.status);

    console.error("Code:", error?.code);

    console.error("Stack:", error?.stack);

    throw error;
  }
};

// ==================================================
// GENERATE SUMMARY
// ==================================================
// POST /api/ai/generate-summary
// ==================================================

export const generateSummary = async (text) => {
  try {
    // ========================================
    // VALIDATE
    // ========================================

    validateText(text);

    // ========================================
    // DEBUG
    // ========================================

    console.log("=================================");
    console.log("GEMINI SUMMARY DEBUG");
    console.log("=================================");
    console.log("Model:", MODEL);
    console.log("API key loaded:", Boolean(process.env.GEMINI_API_KEY));
    console.log("Document text length:", text.length);

    // ========================================
    // PROMPT
    // ========================================

    const prompt = `
You are an educational AI assistant.

Create a clear and useful summary of the
following document.

Include:

- Main ideas
- Important concepts
- Key facts
- Important definitions
- Important conclusions

Use simple educational language.

Structure the answer using headings
and bullet points where appropriate.

IMPORTANT:

- Use ONLY information from the document.
- Do NOT invent facts.
- Do NOT add information that is not present
  in the document.

DOCUMENT:

${limitText(text, 20000)}
`;

    // ========================================
    // CALL GEMINI
    // ========================================

    const response = await getAIClient().models.generateContent({
      model: MODEL,
      contents: prompt,
    });

    // ========================================
    // RESPONSE
    // ========================================

    const summary = response.text?.trim() || "";

    if (!summary) {
      throw new Error("Gemini returned an empty summary");
    }

    console.log("Summary generated successfully.");

    return summary;
  } catch (error) {
    console.error("=================================");
    console.error("GEMINI SUMMARY ERROR");
    console.error("=================================");

    console.error("Name:", error?.name);

    console.error("Message:", error?.message);

    console.error("Status:", error?.status);

    console.error("Code:", error?.code);

    console.error("Stack:", error?.stack);

    throw error;
  }
};

// ==================================================
// CHAT WITH DOCUMENT CONTEXT
// ==================================================
// POST /api/ai/chat
// ==================================================

export const chatWithContext = async (question, chunks) => {
  try {
    // ========================================
    // VALIDATE QUESTION
    // ========================================

    if (!question || typeof question !== "string" || !question.trim()) {
      throw new Error("Question is required");
    }

    // ========================================
    // VALIDATE CHUNKS
    // ========================================

    if (!Array.isArray(chunks) || chunks.length === 0) {
      throw new Error("Document context is required");
    }

    // ========================================
    // BUILD CONTEXT
    // ========================================

    const context = chunks
      .map(
        (chunk, index) =>
          `[Chunk ${index + 1}]
${String(chunk.content || "")}`,
      )
      .join("\n\n");

    if (!context.trim()) {
      throw new Error("Document context is empty");
    }

    // ========================================
    // DEBUG
    // ========================================

    console.log("=================================");
    console.log("GEMINI CHAT DEBUG");
    console.log("=================================");
    console.log("Model:", MODEL);
    console.log("API key loaded:", Boolean(process.env.GEMINI_API_KEY));
    console.log("Question:", question);
    console.log("Chunks:", chunks.length);
    console.log("Context length:", context.length);

    // ========================================
    // PROMPT
    // ========================================

    const prompt = `
You are an AI learning assistant.

Answer the user's question using ONLY
the provided document context.

IMPORTANT RULES:

1. Do not invent information.
2. Do not use outside knowledge.
3. If the answer cannot be found in the
   provided context, say exactly:

"I couldn't find enough information in the document to answer that question."

4. Give a clear educational answer.
5. Explain the answer in simple language.

DOCUMENT CONTEXT:

${limitText(context, 20000)}

USER QUESTION:

${question}

ANSWER:
`;

    // ========================================
    // CALL GEMINI
    // ========================================

    const response = await getAIClient().models.generateContent({
      model: MODEL,
      contents: prompt,
    });

    // ========================================
    // RESPONSE
    // ========================================

    const answer = response.text?.trim() || "";

    if (!answer) {
      throw new Error("Gemini returned an empty chat response");
    }

    return answer;
  } catch (error) {
    console.error("=================================");
    console.error("GEMINI CHAT ERROR");
    console.error("=================================");

    console.error("Name:", error?.name);

    console.error("Message:", error?.message);

    console.error("Status:", error?.status);

    console.error("Code:", error?.code);

    console.error("Stack:", error?.stack);

    throw error;
  }
};

// ==================================================
// EXPLAIN CONCEPT
// ==================================================
// POST /api/ai/explain-concept
// ==================================================

export const explainConcept = async (concept, context) => {
  try {
    // ========================================
    // VALIDATE CONCEPT
    // ========================================

    if (!concept || typeof concept !== "string" || !concept.trim()) {
      throw new Error("Concept is required");
    }

    // ========================================
    // VALIDATE CONTEXT
    // ========================================

    if (!context || typeof context !== "string" || !context.trim()) {
      throw new Error("Document context is required");
    }

    // ========================================
    // DEBUG
    // ========================================

    console.log("=================================");
    console.log("GEMINI CONCEPT DEBUG");
    console.log("=================================");
    console.log("Model:", MODEL);
    console.log("API key loaded:", Boolean(process.env.GEMINI_API_KEY));
    console.log("Concept:", concept);
    console.log("Context length:", context.length);

    // ========================================
    // PROMPT
    // ========================================

    const prompt = `
You are an AI learning assistant.

Explain the following concept using ONLY
the supplied document context.

CONCEPT:

${concept}

DOCUMENT CONTEXT:

${limitText(context, 10000)}

Requirements:

1. Explain the concept clearly.
2. Use simple educational language.
3. Break complicated ideas into smaller parts.
4. Include examples when the document supports them.
5. Do NOT invent information.
6. Do NOT use outside knowledge.
7. If the concept is not sufficiently explained
   in the context, clearly say:

"There is not enough information in the document to explain this concept."
`;

    // ========================================
    // CALL GEMINI
    // ========================================

    const response = await getAIClient().models.generateContent({
      model: MODEL,
      contents: prompt,
    });

    // ========================================
    // RESPONSE
    // ========================================

    const explanation = response.text?.trim() || "";

    if (!explanation) {
      throw new Error("Gemini returned an empty concept explanation");
    }

    return explanation;
  } catch (error) {
    console.error("=================================");
    console.error("GEMINI CONCEPT ERROR");
    console.error("=================================");

    console.error("Name:", error?.name);

    console.error("Message:", error?.message);

    console.error("Status:", error?.status);

    console.error("Code:", error?.code);

    console.error("Stack:", error?.stack);

    throw error;
  }
};
