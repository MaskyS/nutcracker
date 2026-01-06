import type { Component } from "solid-js";

interface HeaderProps {
  title: string;
  count?: number;
  total?: number;
}

export const Header: Component<HeaderProps> = (props) => {
  return (
    <header class="header">
      <div class="header-left">
        <div class="logo">N</div>
        <span class="header-title">{props.title}</span>
      </div>
      {props.count !== undefined && props.total !== undefined && (
        <div class="header-right">
          <span class="header-progress">
            <strong>{props.count}</strong> / {props.total}
          </span>
        </div>
      )}
    </header>
  );
};
