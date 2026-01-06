const API_URL = "http://localhost:3000";

export const api = {
  feed: {
    $get: () => fetch(`${API_URL}/feed`),
  },
  books: {
    $get: () => fetch(`${API_URL}/books`),
    scan: {
      $post: () => fetch(`${API_URL}/books/scan`, { method: "POST" }),
    },
  },
  extracts: {
    bookmarked: {
      $get: () => fetch(`${API_URL}/extracts/bookmarked`),
    },
    interaction: {
      $post: (opts: { json: { extractId: number; type: string; durationMs?: number } }) =>
        fetch(`${API_URL}/extracts/interaction`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(opts.json),
        }),
    },
    ":id": {
      bookmark: {
        $post: (opts: { param: { id: string } }) =>
          fetch(`${API_URL}/extracts/${opts.param.id}/bookmark`, { method: "POST" }),
      },
      unbookmark: {
        $post: (opts: { param: { id: string } }) =>
          fetch(`${API_URL}/extracts/${opts.param.id}/unbookmark`, { method: "POST" }),
      },
      dismiss: {
        $post: (opts: { param: { id: string } }) =>
          fetch(`${API_URL}/extracts/${opts.param.id}/dismiss`, { method: "POST" }),
      },
    },
  },
};

// Type helpers for response data
export type FeedResponse = {
  posts: Array<{
    id: number;
    quote: string;
    pageHint: number | null;
    category: string | null;
    context: string | null;
    bookmarked: boolean | null;
    showCount: number | null;
    bookTitle: string | null;
    bookAuthor: string | null;
  }>;
  count: number;
  quota: number;
  allCaughtUp: boolean;
};

export type Book = {
  id: number;
  title: string;
  author: string | null;
  filePath: string;
  processingStatus: string | null;
  extractCount: number | null;
};
