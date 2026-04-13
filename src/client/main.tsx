import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Display } from "./Display";
import { Remote } from "./Remote";
import { Editor } from "./Editor";
import { Landing } from "./Landing";

function App() {
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  const presentationId = params.get("p") ?? undefined;

  if (path === "/remote") {
    return <Remote presentationId={presentationId} />;
  }

  if (path === "/editor") {
    if (!presentationId) return <Landing />;
    return <Editor presentationId={presentationId} />;
  }

  // "/" with ?p= → Display; "/" without → Landing
  if (!presentationId) {
    return <Landing />;
  }

  return <Display presentationId={presentationId} />;
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
