import domReady from "@wordpress/dom-ready";
import { createRoot } from "@wordpress/element";

import App from "./App";
import "./style.css";

domReady(() => {
  const rootElm = document.getElementById("wpff-builder");
  const root = createRoot(rootElm);

  root.render(<App />);
});
