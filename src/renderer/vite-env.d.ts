/// <reference types="vite/client" />

import type { QuiverApi } from "../shared/types/ipc";

declare module "*.css";

declare global {
  interface Window {
    quiverApi: QuiverApi;
  }
}
