import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { VoixProvider } from "./hooks/useVoix";
import "./index.css";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <VoixProvider>
      <App />
    </VoixProvider>
  </React.StrictMode>
);
