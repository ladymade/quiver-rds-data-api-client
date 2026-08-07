import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  root: "src/renderer",
  base: "./",
  build: {
    outDir: resolve(__dirname, "dist/renderer"),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@shared": resolve(__dirname, "src/shared"),
    },
  },
  server: {
    port: 5173,
  },
});
