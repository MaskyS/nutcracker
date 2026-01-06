import { GoogleGenAI, createPartFromUri } from "@google/genai";
import { createHash } from "crypto";

const MODEL = "gemini-3-flash-preview";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!
});

const extractSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      quote: {
        type: "string",
        description: "The verbatim quote from the book (1-3 sentences)"
      },
      page_hint: {
        type: "integer",
        description: "Approximate page number"
      },
      category: {
        type: "string",
        enum: ["insight", "wisdom", "humor", "technical", "story"],
        description: "Category of the quote"
      },
      context: {
        type: "string",
        description: "Brief context about where this appears in the book"
      }
    },
    required: ["quote", "category"]
  }
};

const EXTRACTION_PROMPT = `You are a literary curator extracting the most valuable quotes from this book.

Find 15-20 of the BEST quotes that:
- Stand alone meaningfully (make sense without context)
- Are insightful, surprising, or beautifully written
- Would make someone want to read the book
- Cover different themes/topics from the book

For each quote:
1. Extract it VERBATIM from the text
2. Note the approximate page if visible
3. Categorize it (insight, wisdom, humor, technical, story)
4. Add brief context about where it appears

Skip:
- Technical formulas or equations (unless explained beautifully)
- Lists, tables, or indexes
- Filler text or transitions

Return as JSON array.`;

export interface ExtractedQuote {
  quote: string;
  page_hint?: number;
  category: "insight" | "wisdom" | "humor" | "technical" | "story";
  context?: string;
  contentHash: string;
}

export async function extractQuotes(filePath: string): Promise<ExtractedQuote[]> {
  // 1. Upload to Files API
  console.log(`Uploading ${filePath}...`);
  const file = await ai.files.upload({
    file: filePath,
    config: { displayName: filePath.split("/").pop() }
  });

  // 2. Wait for processing
  console.log(`Waiting for file processing...`);
  let uploaded = await ai.files.get({ name: file.name! });
  while (uploaded.state === "PROCESSING") {
    await new Promise(r => setTimeout(r, 2000));
    uploaded = await ai.files.get({ name: file.name! });
    console.log(`  Status: ${uploaded.state}`);
  }

  if (uploaded.state === "FAILED") {
    throw new Error("File processing failed");
  }

  // 3. Extract with structured output
  console.log(`Extracting quotes with ${MODEL}...`);
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      EXTRACTION_PROMPT,
      createPartFromUri(uploaded.uri!, uploaded.mimeType!)
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: extractSchema
    }
  });

  // 4. Parse and hash for dedup
  const text = response.text;
  if (!text) {
    throw new Error("No response text from Gemini");
  }

  const quotes = JSON.parse(text) as Omit<ExtractedQuote, "contentHash">[];
  console.log(`Extracted ${quotes.length} quotes`);

  return quotes.map(q => ({
    ...q,
    contentHash: createHash("sha256").update(q.quote).digest("hex").slice(0, 16)
  }));
}
