# Nutcracker: Book Quote Extraction & Spaced Resurfacing

## Vision

Surface the best insights from your "anti-library" (books you own but haven't fully read) through an implicit spaced repetition feed. Like Twitter, but every post is a hand-picked quote from your books.

## Stack

| Component | Tool | Why |
|-----------|------|-----|
| Runtime | **Bun** | Fast, native TypeScript, built-in SQLite |
| PDF Processing | **Gemini 3 Flash Native** | Direct PDF vision, no parsing/chunking needed |
| Model | **gemini-3-flash-preview** | Cheap, fast, handles up to 1000 pages |
| Database | **SQLite + Drizzle** | Simple, file-based, single-user |
| API | **Hono** | Fast, type-safe RPC |
| Frontend | **SolidJS** | Fine-grained reactivity, mobile-first |

## Architecture

```
~/Downloads/Books/  →  Gemini 3 Flash  →  SQLite  →  Hono API  →  SolidJS Feed
     (PDFs)            (extract quotes)   (store)    (serve)      (display)
```

## Design Decisions

### Extraction

- **Gemini native PDF vision**: Upload whole file, not chunks. Gemini can see entire documents up to 1000 pages.
- **Structured output**: Use JSON schema for type-safe extraction
- **15-20 quotes per book**: Quality over quantity. "Best of" not "comprehensive"
- **Verbatim quotes**: Extract exact text, not paraphrases
- **Categories**: insight, wisdom, humor, technical, story

### Quote Selection Criteria

- High density of insight (not filler)
- Stand alone meaningfully (make sense without context)
- Would make someone want to read the book
- Cover different themes/topics
- Skip: tables, lists, indexes, equations (unless beautifully explained)

### Deduplication

- SHA256 hash of quote text (first 16 chars)
- On re-extraction: merge new quotes, skip existing hashes
- Preserves user interactions on existing quotes

### Feed Mechanics (Implicit Spaced Repetition)

| Constant | Value | Rationale |
|----------|-------|-----------|
| Daily quota | 50 posts | Enough to browse, not overwhelming |
| Min interval | 7 days | Don't show same quote too soon |
| Dismiss delay | 30 days | Dismissed posts resurface eventually |
| Feed order | Random | Simple, revisit if diversity needed |

### Implicit SR Signals

| Signal | Meaning | Action |
|--------|---------|--------|
| Pause > 3s | Interest | Track for future weighting |
| Expand | Strong interest | Track interaction |
| Bookmark | High value | Save to collection |
| Dismiss | Not relevant now | Delay 30+ days |
| Quick scroll < 500ms | Disinterest | Track for future |

### API Design

```
GET  /feed                  → Daily posts with SR filtering
POST /feed/:id/view         → Mark as viewed, update lastShownAt

GET  /extracts/bookmarked   → Saved posts
GET  /extracts/:id          → Single extract with context
POST /extracts/:id/bookmark → Save
POST /extracts/:id/dismiss  → Dismiss (30-day delay)
POST /extracts/interaction  → Track pause/expand/scroll

GET  /books                 → Library list
GET  /books/:id             → Book detail with extracts
POST /books/scan            → Scan ~/Downloads/Books for PDFs
POST /books/:id/extract     → Trigger Gemini extraction
```

### Database Schema

```
sources: id, title, author, filePath, fileHash, processingStatus, extractCount, createdAt

extracts: id, sourceId, quote, pageHint, category, context, contentHash,
          showCount, lastShownAt, bookmarked, dismissed, createdAt

interactions: id, extractId, type, durationMs, createdAt
```

### Frontend (Planned)

- Mobile-first responsive design
- Bottom nav: Feed / Library / Saved
- Post card: quote, book title, category badge, actions
- "All caught up" state when quota exhausted
- Expand to show context

## Environment

```bash
GOOGLE_GENERATIVE_AI_API_KEY=...  # Gemini API key
```

Books directory: `~/Downloads/Books/` (PDFs)

## Scripts

```bash
bun run dev        # Start with watch mode
bun run start      # Production start
bun run db:push    # Apply schema changes
bun run db:studio  # Open Drizzle Studio
```

## Future Considerations

- Book metadata extraction via Gemini (title/author from first pages)
- File watcher for auto-detecting new PDFs
- Background extraction queue
- Export bookmarks to markdown/Readwise
- Weighted feed algorithm based on interaction history
