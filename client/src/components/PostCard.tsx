import { createSignal, Show, onMount, onCleanup } from "solid-js";
import type { Component } from "solid-js";
import { BookCover } from "./BookCover";
import { api } from "../api";

interface PostCardProps {
  id: number;
  quote: string;
  pageHint: number | null;
  category: string | null;
  context: string | null;
  bookmarked: boolean | null;
  showCount: number | null;
  bookTitle: string | null;
  bookAuthor: string | null;
  onDismiss?: () => void;
  onBookmarkChange?: (bookmarked: boolean) => void;
}

export const PostCard: Component<PostCardProps> = (props) => {
  const [expanded, setExpanded] = createSignal(false);
  const [saved, setSaved] = createSignal(props.bookmarked ?? false);
  let mountTime: number;

  // Track view duration on unmount
  onMount(() => {
    mountTime = Date.now();
  });

  onCleanup(() => {
    const duration = Date.now() - mountTime;
    if (duration > 3000) {
      // Track as pause interaction
      api.extracts.interaction.$post({
        json: {
          extractId: props.id,
          type: "pause",
          durationMs: duration,
        },
      }).catch(console.error);
    }
  });

  const toggleExpand = () => {
    const newState = !expanded();
    setExpanded(newState);
    if (newState) {
      api.extracts.interaction.$post({
        json: { extractId: props.id, type: "expand" },
      }).catch(console.error);
    }
  };

  const toggleSave = async () => {
    const newState = !saved();
    setSaved(newState);

    if (newState) {
      await api.extracts[":id"].bookmark.$post({
        param: { id: props.id.toString() },
      });
    } else {
      await api.extracts[":id"].unbookmark.$post({
        param: { id: props.id.toString() },
      });
    }

    props.onBookmarkChange?.(newState);
  };

  const dismiss = async () => {
    await api.extracts[":id"].dismiss.$post({
      param: { id: props.id.toString() },
    });
    props.onDismiss?.();
  };

  return (
    <article class="post">
      <Show when={(props.showCount ?? 0) > 1}>
        <span class="seen-badge">{props.showCount}x</span>
      </Show>

      <div class="post-source">
        <BookCover title={props.bookTitle || "Unknown"} size="small" />
        <div class="source-info">
          <div class="source-title">{props.bookTitle || "Unknown Book"}</div>
          <div class="source-meta">
            {props.bookAuthor || "Unknown Author"}
            {props.pageHint && ` · p. ${props.pageHint}`}
          </div>
        </div>
      </div>

      <blockquote class="post-quote">{props.quote}</blockquote>

      <Show when={expanded() && props.context}>
        <div class="post-context">
          <div class="context-label">Context</div>
          <p class="context-text">{props.context}</p>
        </div>
      </Show>

      <div class="post-actions">
        <button
          class={`action primary ${expanded() ? "active" : ""}`}
          onClick={toggleExpand}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
          </svg>
          {expanded() ? "Less" : "More"}
        </button>

        <button
          class={`action ${saved() ? "active" : ""}`}
          onClick={toggleSave}
        >
          <Show
            when={saved()}
            fallback={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
              </svg>
            }
          >
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
            </svg>
          </Show>
          {saved() ? "Saved" : "Save"}
        </button>

        <button class="action dismiss" onClick={dismiss}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </article>
  );
};
