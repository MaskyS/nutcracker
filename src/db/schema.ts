import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const sources = sqliteTable("sources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  author: text("author"),
  filePath: text("file_path").notNull().unique(),
  fileHash: text("file_hash"),
  processingStatus: text("processing_status", {
    enum: ["pending", "processing", "done", "error"]
  }).default("pending"),
  extractCount: integer("extract_count").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const extracts = sqliteTable("extracts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sourceId: integer("source_id").references(() => sources.id),
  quote: text("quote").notNull(),
  pageHint: integer("page_hint"),
  category: text("category", {
    enum: ["insight", "wisdom", "humor", "technical", "story"]
  }),
  context: text("context"),
  contentHash: text("content_hash").notNull().unique(),
  showCount: integer("show_count").default(0),
  lastShownAt: integer("last_shown_at", { mode: "timestamp" }),
  bookmarked: integer("bookmarked", { mode: "boolean" }).default(false),
  dismissed: integer("dismissed", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const interactions = sqliteTable("interactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  extractId: integer("extract_id").references(() => extracts.id),
  type: text("type", {
    enum: ["view", "pause", "expand", "bookmark", "dismiss", "quick_scroll"]
  }).notNull(),
  durationMs: integer("duration_ms"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
