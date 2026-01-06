import type { Component } from "solid-js";
import { Router, Route } from "@solidjs/router";
import { Feed } from "./views/Feed";
import { Library } from "./views/Library";
import { Saved } from "./views/Saved";
import { BottomNav } from "./components/BottomNav";
import "./styles.css";

const App: Component = () => {
  return (
    <Router>
      <div class="app">
        <Route path="/" component={Feed} />
        <Route path="/library" component={Library} />
        <Route path="/saved" component={Saved} />
        <BottomNav />
      </div>
    </Router>
  );
};

export default App;
