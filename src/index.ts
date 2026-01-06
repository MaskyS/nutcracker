import { Hono } from "hono";
import { cors } from "hono/cors";
import { feedRoutes } from "./routes/feed";
import { extractRoutes } from "./routes/extracts";
import { bookRoutes } from "./routes/books";

const app = new Hono()
  .use("*", cors())
  .get("/", (c) => c.json({ status: "ok", name: "BookFeed API" }))
  .route("/feed", feedRoutes)
  .route("/extracts", extractRoutes)
  .route("/books", bookRoutes);

export type AppType = typeof app;

console.log("BookFeed API running on http://localhost:3000");

export default {
  port: 3000,
  fetch: app.fetch,
  idleTimeout: 120, // 2 minutes for extraction
};
