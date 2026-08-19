import React from "react";
import ReactDOM from "react-dom/client";
import type { AppLanguage } from "../shared/types/ipc";
import App from "./App";
import { initializeI18n } from "./i18n";
import "./styles/global.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element not found");
}

const reactRoot = ReactDOM.createRoot(root);

async function bootstrap(): Promise<void> {
  let language: AppLanguage = "en";

  try {
    language = (await window.quiverApi.getSettings()).settings.language;
  } catch {
    // Start in English if persisted settings cannot be loaded.
  }

  await initializeI18n(language);

  reactRoot.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

void bootstrap();
