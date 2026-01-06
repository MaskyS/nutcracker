import { createResource, For, Show, createSignal } from "solid-js";
import type { Component } from "solid-js";
import { Header } from "../components/Header";
import { PostCard } from "../components/PostCard";
import { api } from "../api";
import type { FeedResponse } from "../api";

type SavedPost = FeedResponse["posts"][0];

async function fetchSaved(): Promise<SavedPost[]> {
  const res = await api.extracts.bookmarked.$get();
  // Add showCount if missing from bookmarked endpoint
  const data = await res.json() as Array<Omit<SavedPost, "showCount"> & { showCount?: number | null }>;
  return data.map((p) => ({ ...p, showCount: p.showCount ?? 0 }));
}

export const Saved: Component = () => {
  const [saved] = createResource(fetchSaved);
  const [removedIds, setRemovedIds] = createSignal<Set<number>>(new Set());

  const visiblePosts = () => {
    const data = saved();
    if (!data) return [];
    return data.filter((p) => !removedIds().has(p.id));
  };

  const handleUnbookmark = (id: number) => {
    setRemovedIds((prev) => new Set([...prev, id]));
  };

  return (
    <>
      <Header title="Saved" />

      <main class="feed">
        <Show when={saved.loading}>
          <div class="loading">Loading...</div>
        </Show>

        <Show when={saved.error}>
          <div class="loading">Error loading saved posts</div>
        </Show>

        <Show when={!saved.loading && !saved.error}>
          <Show when={visiblePosts().length === 0}>
            <div class="caught-up">
              <div class="caught-up-icon">📚</div>
              <h2>No saved quotes yet</h2>
              <p>Tap Save on quotes you want to keep</p>
            </div>
          </Show>

          <For each={visiblePosts()}>
            {(post) => (
              <PostCard
                id={post.id}
                quote={post.quote}
                pageHint={post.pageHint}
                category={post.category}
                context={post.context}
                bookmarked={true}
                showCount={post.showCount}
                bookTitle={post.bookTitle}
                bookAuthor={post.bookAuthor}
                onBookmarkChange={(bookmarked) => {
                  if (!bookmarked) handleUnbookmark(post.id);
                }}
              />
            )}
          </For>
        </Show>
      </main>
    </>
  );
};
