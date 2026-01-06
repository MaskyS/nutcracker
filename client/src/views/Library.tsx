import { createResource, For, Show } from "solid-js";
import type { Component } from "solid-js";
import { Header } from "../components/Header";
import { BookCover } from "../components/BookCover";
import { api } from "../api";
import type { Book } from "../api";

async function fetchBooks(): Promise<Book[]> {
  const res = await api.books.$get();
  return res.json();
}

export const Library: Component = () => {
  const [books] = createResource(fetchBooks);

  const totalExtracts = () => {
    const data = books();
    if (!data) return 0;
    return data.reduce((sum, b) => sum + (b.extractCount ?? 0), 0);
  };

  return (
    <>
      <Header title="Library" />

      <div class="library">
        <div class="library-header">
          <h1>Your Library</h1>
          <p>
            {books()?.length ?? 0} books · {totalExtracts()} extracts
          </p>
        </div>

        <Show when={books.loading}>
          <div class="loading">Loading...</div>
        </Show>

        <Show when={books.error}>
          <div class="loading">Error loading library</div>
        </Show>

        <Show when={!books.loading && !books.error}>
          <div class="books-grid">
            <For each={books()}>
              {(book) => (
                <div
                  class={`book ${book.processingStatus === "processing" ? "processing" : ""}`}
                >
                  <BookCover title={book.title} size="large" />
                  <div class="book-title">{book.title}</div>
                  <div class="book-meta">
                    {book.processingStatus === "processing"
                      ? "Processing..."
                      : `${book.extractCount ?? 0} extracts`}
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
    </>
  );
};
