import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Display } from "./Display";
import { Remote } from "./Remote";

function App() {
  const path = window.location.pathname;

  if (path === "/remote") {
    return <Remote />;
  }

  return <Display />;
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
