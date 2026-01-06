import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db";
import { extracts, interactions, sources } from "../db/schema";
import { eq } from "drizzle-orm";

export const extractRoutes = new Hono()
  .get("/bookmarked", async (c) => {
    const bookmarked = await db
      .select({
        id: extracts.id,
        quote: extracts.quote,
        pageHint: extracts.pageHint,
        category: extracts.category,
        context: extracts.context,
        bookmarked: extracts.bookmarked,
        bookTitle: sources.title,
        bookAuthor: sources.author,
      })
      .from(extracts)
      .leftJoin(sources, eq(extracts.sourceId, sources.id))
      .where(eq(extracts.bookmarked, true));

    return c.json(bookmarked);
  })
  .get("/:id", async (c) => {
    const id = parseInt(c.req.param("id"));
    const [extract] = await db
      .select({
        id: extracts.id,
        quote: extracts.quote,
        pageHint: extracts.pageHint,
        category: extracts.category,
        context: extracts.context,
        bookmarked: extracts.bookmarked,
        showCount: extracts.showCount,
        bookTitle: sources.title,
        bookAuthor: sources.author,
      })
      .from(extracts)
      .leftJoin(sources, eq(extracts.sourceId, sources.id))
      .where(eq(extracts.id, id));

    if (!extract) {
      return c.json({ error: "Not found" }, 404);
    }

    return c.json(extract);
  })
  .post("/:id/bookmark", async (c) => {
    const id = parseInt(c.req.param("id"));
    await db.update(extracts)
      .set({ bookmarked: true })
      .where(eq(extracts.id, id));
    await db.insert(interactions).values({
      extractId: id,
      type: "bookmark"
    });
    return c.json({ ok: true });
  })
  .post("/:id/unbookmark", async (c) => {
    const id = parseInt(c.req.param("id"));
    await db.update(extracts)
      .set({ bookmarked: false })
      .where(eq(extracts.id, id));
    return c.json({ ok: true });
  })
  .post("/:id/dismiss", async (c) => {
    const id = parseInt(c.req.param("id"));
    await db.update(extracts)
      .set({ dismissed: true, lastShownAt: new Date() })
      .where(eq(extracts.id, id));
    await db.insert(interactions).values({
      extractId: id,
      type: "dismiss"
    });
    return c.json({ ok: true });
  })
  .post("/interaction",
    zValidator("json", z.object({
      extractId: z.number(),
      type: z.enum(["view", "pause", "expand", "quick_scroll"]),
      durationMs: z.number().optional()
    })),
    async (c) => {
      const body = c.req.valid("json");
      await db.insert(interactions).values(body);
      return c.json({ ok: true });
    }
  );
