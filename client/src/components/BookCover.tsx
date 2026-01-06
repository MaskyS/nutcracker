import type { Component } from "solid-js";

// Generate a gradient from a string (title)
function stringToGradient(str: string): string {
  const gradients = [
    "linear-gradient(135deg, #1E3A5F, #2D5A87)",
    "linear-gradient(135deg, #5D4037, #795548)",
    "linear-gradient(135deg, #2E7D32, #43A047)",
    "linear-gradient(135deg, #6A1B9A, #8E24AA)",
    "linear-gradient(135deg, #C62828, #E53935)",
    "linear-gradient(135deg, #37474F, #546E7A)",
    "linear-gradient(135deg, #00695C, #00897B)",
    "linear-gradient(135deg, #4527A0, #5E35B1)",
    "linear-gradient(135deg, #AD1457, #D81B60)",
    "linear-gradient(135deg, #EF6C00, #FB8C00)",
  ];

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  return gradients[Math.abs(hash) % gradients.length];
}

interface BookCoverProps {
  title: string;
  size?: "small" | "large";
  class?: string;
}

export const BookCover: Component<BookCoverProps> = (props) => {
  const initial = () => props.title.charAt(0).toUpperCase();
  const gradient = () => stringToGradient(props.title);

  return (
    <div
      class={`${props.size === "large" ? "book-cover" : "source-cover"} ${props.class || ""}`}
      style={{ background: gradient() }}
    >
      <span>{initial()}</span>
    </div>
  );
};
