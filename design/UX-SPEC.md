# BookFeed UX Specification

## Product Definition

### Job to Be Done
Surface ROI from your anti-library — make books you own but haven't read feel accessible without reading cover-to-cover.

### Success Metric
"Books feel accessible" — the shelf becomes a resource, not a guilt pile.

### Core Insight
Focus on the **original content**. The AI is a curator, not a commentator. The book is the star.

---

## Atomic Unit: The Post

A post is primarily a **direct quote** (90%), occasionally a **distilled insight** (10%), rarely a **question**.

### Post Anatomy

```
┌─────────────────────────────────────────────┐
│  [Book Cover]  Book Title                   │
│               Author · p. 127               │
│                                             │
│  │ "The quote itself, displayed in a        │
│  │  literary serif font. This is the        │
│  │  hero element."                          │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ ✦ Optional AI insight (10% of posts)│    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [tag] [tag]                                │
│                                             │
│  ─────────────────────────────────────────  │
│  [Expand] [Save] [✕]           Seen 2x      │
└─────────────────────────────────────────────┘
```

### Selection Criteria (What makes a good extract)
1. **Density of insight** — high signal-to-noise, says something substantive
2. **Variety** — mix of types: facts, arguments, stories, aphorisms

### Extract Types (AI generation modes)

| Type | Frequency | Description |
|------|-----------|-------------|
| `quote` | ~80% | Direct verbatim extract |
| `insight` | ~15% | AI-distilled takeaway |
| `question` | ~5% | Recall prompt |

---

## Feed Mechanics

### Daily Model
- Generate **~50 posts per day** (configurable)
- Pull from across the entire library (not clustered by book)
- Track **seen/unseen** status

### Session Flow
```
Open app
    ↓
Scroll through posts (frictionless, Twitter-like)
    ↓
Pause naturally on interesting ones (implicit signal)
    ↓
Optionally: Expand, Save, or Dismiss
    ↓
Continue until "All Caught Up"
    ↓
Session ends naturally
```

### "All Caught Up" State
When user has seen most/all daily posts:
- Show completion screen
- Display session stats (posts seen, saved, books touched)
- Clear stopping point — no infinite scroll guilt

### What Makes the Feed Feel Wrong
**Primary failure mode**: Seeing the same post too soon

Mitigation:
- Track `lastShownAt` timestamp per post
- Minimum interval before reshowing (e.g., 7 days)
- Interleave sources — never cluster posts from same book

---

## Implicit Spaced Repetition

### Philosophy
SR is **implicit**, not explicit. No "Easy/Hard" buttons. Feels like Spotify discovery, not Anki drilling.

### Signals Captured

| Signal | Meaning | Weight |
|--------|---------|--------|
| Scroll pause > 3s | Interest | + |
| Expanded | Deep interest | ++ |
| Saved | High value | +++ |
| Dismiss (✕) | Not relevant | -- |
| Quick scroll-past < 500ms | Disinterest | - |

### Resurfacing Logic
- New posts: 30% of feed
- Previously seen (cooled off): 50% of feed
- Serendipity (random older): 20% of feed

**Simple rule**: Don't show a post again until at least N days have passed (default: 7).

---

## Interactions

### Expand
- Reveals surrounding context from the book
- Highlights the extract within the context
- Tracks as strong positive signal

### Save (Bookmark)
- Adds to "Saved" collection
- Strongest positive signal
- Persists across sessions

### Dismiss (✕)
- Removes from current feed
- Delays resurfacing significantly (e.g., 30+ days)
- Does NOT permanently hide

---

## Upload / Ingestion

### Method
**Auto-scan folder** — point at `~/Books`, watches for changes

### Flow
```
Book added to ~/Books
    ↓
Detected by file watcher
    ↓
Added to processing queue
    ↓
Background: Parse → Chunk → AI Extract
    ↓
Posts trickle into feed over time
```

### Processing States
1. `pending` — detected, queued
2. `processing` — actively extracting
3. `completed` — ready, posts in feed
4. `failed` — parsing error

### Visual Indicator
Books currently processing show shimmer animation on cover.

---

## Views

### 1. Feed (Primary)
- Header: "Today's Feed" + date + progress bar
- Scrolling list of post cards
- Ends with "All Caught Up"

### 2. Library
- Grid of book covers
- Click book → filtered view of its posts
- Shows extract count per book
- Processing indicator for in-progress books

### 3. Saved
- Chronological list of bookmarked posts
- Same card format as feed

---

## Visual Design

### Platform
**Mobile-first** — this is a "scroll while waiting for coffee" app. Desktop is just a centered mobile view.

### Aesthetic
**Modern Literary Editorial** — the book is the star, the interface is a respectful frame.

### Typography
- **Quotes**: Serif (Newsreader) — literary, readable, 18px on mobile
- **UI**: Sans (DM Sans) — clean, friendly, good for touch targets

### Color
- Warm paper backgrounds (#FAFAF8)
- Terracotta accent (#C45D3E) — warm, bookish
- Minimal, intentional color use

### Book Covers
- Gradient backgrounds with author initial
- Subtle spine effect (left edge shadow)
- Conveys "bookness" without needing actual cover art

### Touch Targets
- All buttons minimum 44px touch target
- Cards have active state (scale 0.99)
- Bottom nav for thumb-friendly navigation

---

## Key Screens (Mobile-First)

### Feed Screen
```
┌────────────────────────┐
│ [B] Today      23/50   │  ← Sticky header
├────────────────────────┤
│                        │
│ ┌────────────────────┐ │
│ │ [Cover] Title      │ │
│ │         Author·p.X │ │
│ │                    │ │
│ │ │ "Quote text..."  │ │
│ │                    │ │
│ │ ──────────────────│ │
│ │ [More] [Save] [✕] │ │
│ └────────────────────┘ │
│                        │
│ ┌────────────────────┐ │
│ │  [Post Card 2]     │ │
│ └────────────────────┘ │
│                        │
├────────────────────────┤
│  Feed  Library  Saved  │  ← Bottom nav
└────────────────────────┘
```

### All Caught Up Screen
```
┌────────────────────────┐
│ [B] All Done!          │
├────────────────────────┤
│                        │
│          ✓             │
│                        │
│   You're all caught up │
│   Come back tomorrow   │
│                        │
│   50    8    12        │
│  Today Saved Books     │
│                        │
├────────────────────────┤
│  Feed  Library  Saved  │
└────────────────────────┘
```

---

## Riskiest Assumption

**Feed algorithm feel** — will the mix feel right, not repetitive?

### Test Plan
1. Seed with 3-5 books
2. Generate 50 posts
3. Manual review: Does variety feel good?
4. Use for 3 days: Does resurfacing feel natural?

---

## MVP Scope

### Must Have
- [ ] Feed with post cards
- [ ] Progress indicator (X of 50)
- [ ] "All Caught Up" end state
- [ ] Expand interaction
- [ ] Dismiss button
- [ ] Save/bookmark
- [ ] Library view (list of books)
- [ ] Auto-scan ~/Books folder
- [ ] PDF parsing
- [ ] AI extract generation (Gemini Flash)
- [ ] Basic "don't show too soon" logic

### Defer
- EPUB parsing (add after PDF works)
- Sophisticated SR algorithm
- Search
- Export
- Dark mode
- Desktop-specific layouts (desktop just centers the mobile view)
