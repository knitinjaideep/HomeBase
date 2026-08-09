import { defineConfig, devices } from "@playwright/test";
import { MOCK_PORT, MOCK_URL, APP_PORT, APP_URL } from "./e2e/constants";

/**
 * Runs the whole app against the fake backend in `e2e/mock-server.mjs` —
 * never a real Supabase project. Both webServers are started fresh for
 * every run (`reuseExistingServer: false`, unconditionally) specifically so
 * this can never accidentally attach to a developer's already-running
 * `next dev` instance, which would be pointed at the real project via
 * `.env.local`. See `e2e/mock-server.mjs`'s header comment for why a real
 * local HTTP server is used instead of Playwright's `page.route()` —
 * Next.js middleware validates the session from the server process, which
 * route-interception can't reach.
 */

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  // Strictly sequential: the mock server (e2e/mock-server.mjs) tracks "the
  // household the last create_household call made" as a single in-memory
  // value, not per-session state — correct only because exactly one test
  // is ever running against it at a time.
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: "list",
  timeout: 30_000,
  use: {
    baseURL: APP_URL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: `node mock-server.mjs ${MOCK_PORT}`,
      cwd: "./e2e",
      url: MOCK_URL,
      reuseExistingServer: false,
      timeout: 10_000,
      stdout: "pipe",
      stderr: "pipe",
    },
    {
      // A production build+start, not `next dev` — avoids dev mode's Fast
      // Refresh remounting HouseholdProvider mid-flight on every HMR
      // rebuild. NEXT_PUBLIC_* vars are inlined at build time, so the mock
      // URL must be set before `next build`, not just `next start`.
      command: `npx next build && npx next start -p ${APP_PORT}`,
      url: APP_URL,
      reuseExistingServer: false,
      timeout: 180_000,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: MOCK_URL,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "e2e-anon-key",
        PREVIEW_GATE_ENABLED: "false",
      },
    },
  ],
});
