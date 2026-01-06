import { createResource, For, Show, createSignal } from "solid-js";
import type { Component } from "solid-js";
import { Header } from "../components/Header";
import { PostCard } from "../components/PostCard";
import { AllCaughtUp } from "../components/AllCaughtUp";
import { api } from "../api";
import type { FeedResponse } from "../api";

async function fetchFeed(): Promise<FeedResponse> {
  const res = await api.feed.$get();
  return res.json();
}

export const Feed: Component = () => {
  const [feed] = createResource(fetchFeed);
  const [dismissedIds, setDismissedIds] = createSignal<Set<number>>(new Set());

  const visiblePosts = () => {
    const data = feed();
    if (!data) return [];
    return data.posts.filter((p) => !dismissedIds().has(p.id));
  };

  const handleDismiss = (id: number) => {
    setDismissedIds((prev) => new Set([...prev, id]));
  };

  const allCaughtUp = () => {
    const data = feed();
    return data?.allCaughtUp || visiblePosts().length === 0;
  };

  return (
    <>
      <Header
        title="Today"
        count={visiblePosts().length}
        total={feed()?.quota ?? 50}
      />

      <main class="feed">
        <Show when={feed.loading}>
          <div class="loading">Loading...</div>
        </Show>

        <Show when={feed.error}>
          <div class="loading">Error loading feed. Is the server running?</div>
        </Show>

        <Show when={!feed.loading && !feed.error}>
          <Show when={allCaughtUp()}>
            <AllCaughtUp
              todayCount={feed()?.quota ?? 50}
              savedCount={0}
              booksCount={0}
            />
          </Show>

          <Show when={!allCaughtUp()}>
            <For each={visiblePosts()}>
              {(post) => (
                <PostCard
                  id={post.id}
                  quote={post.quote}
                  pageHint={post.pageHint}
                  category={post.category}
                  context={post.context}
                  bookmarked={post.bookmarked}
                  showCount={post.showCount}
                  bookTitle={post.bookTitle}
                  bookAuthor={post.bookAuthor}
                  onDismiss={() => handleDismiss(post.id)}
                />
              )}
            </For>
          </Show>
        </Show>
      </main>
    </>
  );
};
