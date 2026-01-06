import { Hono } from "hono";
import { db } from "../db";
import { extracts, sources } from "../db/schema";
import { and, eq, lt, or, isNull, sql } from "drizzle-orm";

const DAILY_QUOTA = 50;
const MIN_DAYS_BETWEEN = 7;
const DISMISS_DELAY_DAYS = 30;

export const feedRoutes = new Hono()
  .get("/", async (c) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - MIN_DAYS_BETWEEN);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - DISMISS_DELAY_DAYS);

    // Get today's feed with book info
    const feed = await db
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
      .where(
        and(
          // Not dismissed, OR dismissed but 30+ days ago
          or(
            eq(extracts.dismissed, false),
            lt(extracts.lastShownAt, thirtyDaysAgo)
          ),
          // Never shown OR shown 7+ days ago
          or(
            isNull(extracts.lastShownAt),
            lt(extracts.lastShownAt, sevenDaysAgo)
          )
        )
      )
      .orderBy(sql`RANDOM()`)
      .limit(DAILY_QUOTA);

    return c.json({
      posts: feed,
      count: feed.length,
      quota: DAILY_QUOTA,
      allCaughtUp: feed.length === 0
    });
  })
  .post("/:id/view", async (c) => {
    const id = parseInt(c.req.param("id"));
    await db.update(extracts)
      .set({
        showCount: sql`${extracts.showCount} + 1`,
        lastShownAt: new Date()
      })
      .where(eq(extracts.id, id));
    return c.json({ ok: true });
  });
