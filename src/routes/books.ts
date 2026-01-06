import { Hono } from "hono";
import { db } from "../db";
import { sources, extracts } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import { extractQuotes } from "../lib/extractor";
import { readdir } from "fs/promises";
import { join } from "path";

const BOOKS_DIR = join(process.env.HOME!, "Downloads/Books");

export const bookRoutes = new Hono()
  .get("/", async (c) => {
    const books = await db.select().from(sources);
    return c.json(books);
  })
  .get("/:id", async (c) => {
    const id = parseInt(c.req.param("id"));
    const [book] = await db.select().from(sources).where(eq(sources.id, id));

    if (!book) {
      return c.json({ error: "Not found" }, 404);
    }

    // Get extract count for this book
    const bookExtracts = await db
      .select()
      .from(extracts)
      .where(eq(extracts.sourceId, id));

    return c.json({
      ...book,
      extracts: bookExtracts
    });
  })
  .post("/scan", async (c) => {
    // Scan directory for PDFs
    let files: string[];
    try {
      files = await readdir(BOOKS_DIR);
    } catch (e) {
      return c.json({ error: `Cannot read ${BOOKS_DIR}` }, 500);
    }

    const pdfs = files.filter(f => f.toLowerCase().endsWith(".pdf"));

    const results = [];
    for (const pdf of pdfs) {
      const filePath = join(BOOKS_DIR, pdf);
      // Insert if not exists
      const existing = await db.select()
        .from(sources)
        .where(eq(sources.filePath, filePath))
        .limit(1);

      if (existing.length === 0) {
        const [inserted] = await db.insert(sources)
          .values({
            title: pdf.replace(".pdf", ""),
            filePath
          })
          .returning();
        results.push({ action: "added", book: inserted });
      }
    }

    return c.json({
      scanned: pdfs.length,
      added: results.length,
      results
    });
  })
  .post("/:id/extract", async (c) => {
    const id = parseInt(c.req.param("id"));
    const [book] = await db.select()
      .from(sources)
      .where(eq(sources.id, id));

    if (!book) {
      return c.json({ error: "Not found" }, 404);
    }

    // Update status
    await db.update(sources)
      .set({ processingStatus: "processing" })
      .where(eq(sources.id, id));

    try {
      const quotes = await extractQuotes(book.filePath);

      // Insert with dedup (skip existing contentHash)
      let inserted = 0;
      for (const q of quotes) {
        try {
          await db.insert(extracts).values({
            sourceId: id,
            quote: q.quote,
            pageHint: q.page_hint,
            category: q.category,
            context: q.context,
            contentHash: q.contentHash
          });
          inserted++;
        } catch (e) {
          // Duplicate contentHash, skip
        }
      }

      await db.update(sources)
        .set({
          processingStatus: "done",
          extractCount: sql`${sources.extractCount} + ${inserted}`
        })
        .where(eq(sources.id, id));

      return c.json({
        extracted: inserted,
        duplicates: quotes.length - inserted,
        total: quotes.length
      });
    } catch (e) {
      await db.update(sources)
        .set({ processingStatus: "error" })
        .where(eq(sources.id, id));

      console.error("Extraction error:", e);
      return c.json({ error: String(e) }, 500);
    }
  });
