import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  // tsconfig uses jsx: "preserve" for Next; pin the React automatic runtime so
  // the .tsx component tests transform without needing a manual React import.
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // .tsx tests render pure presentational components to static markup
    // (react-dom/server) — no DOM/jsdom needed, so the node env still applies.
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
