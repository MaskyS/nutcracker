import type { Component } from "solid-js";

interface AllCaughtUpProps {
  todayCount: number;
  savedCount: number;
  booksCount: number;
}

export const AllCaughtUp: Component<AllCaughtUpProps> = (props) => {
  return (
    <div class="caught-up">
      <div class="caught-up-icon">✓</div>
      <h2>You're all caught up</h2>
      <p>Come back tomorrow for fresh extracts</p>
      <div class="caught-up-stats">
        <div class="stat">
          <div class="stat-value">{props.todayCount}</div>
          <div class="stat-label">Today</div>
        </div>
        <div class="stat">
          <div class="stat-value">{props.savedCount}</div>
          <div class="stat-label">Saved</div>
        </div>
        <div class="stat">
          <div class="stat-value">{props.booksCount}</div>
          <div class="stat-label">Books</div>
        </div>
      </div>
    </div>
  );
};
