// A minimal, purpose-built stand-in for the Supabase Auth/REST/Storage APIs,
// used only by the Playwright e2e suite. It is NOT a general PostgREST
// emulator — it supports exactly the query shapes this codebase's repo/service
// layer actually issues (select/insert/upsert/update/delete with `eq`/`neq`/`is`
// filters, `.maybeSingle()`/`.single()`, and the two RPCs the onboarding flow
// calls). Real Supabase project credentials are never used here — this server
// is what NEXT_PUBLIC_SUPABASE_URL points at for the whole e2e run, so both
// the browser (client components) and the Next.js server process (middleware,
// which validates the session server-side and is invisible to Playwright's
// page.route()) talk to the same fake backend.
//
// Run directly: `node e2e/mock-server.mjs` (reads PORT from argv[2], default 54321).

import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const port = Number(process.argv[2] ?? process.env.MOCK_SUPABASE_PORT ?? 54321);

/** @type {Map<string, Record<string, unknown>[]>} */
const tables = new Map();

// Tracks the household the last `create_household` call made, so a later
// `bootstrap_household()` — called again on every fresh page load, since
// HouseholdProvider re-resolves on every mount — returns the same household
// instead of sending an already-onboarded browser back through onboarding.
// Correct only because Playwright runs this suite with a single worker (see
// playwright.config.ts), so exactly one test is ever active at a time.
let currentHouseholdId = null;

function tableRows(name) {
  if (!tables.has(name)) tables.set(name, []);
  return tables.get(name);
}

function nowIso() {
  return new Date().toISOString();
}

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve(undefined);
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve(undefined);
      }
    });
  });
}

function send(res, status, body) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    // The app runs on a different origin (port) than this mock server, so
    // this is a cross-origin fetch — and `Content-Range` (how the HEAD
    // count-only query below reports its count) isn't in the default
    // CORS-safelisted response headers a browser exposes to JS. Without
    // this, `response.headers.get("content-range")` silently returns null,
    // `seedIfNeeded` reads a falsy count, and re-seeds on every page load.
    "Access-Control-Expose-Headers": "*",
  };
  if (body === undefined) {
    res.writeHead(status, cors);
    res.end();
    return;
  }
  res.writeHead(status, { ...cors, "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

// ---- A fixed fake session, reused by every sign-in ------------------------

function fakeUser(email) {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    aud: "authenticated",
    role: "authenticated",
    email,
    app_metadata: {},
    user_metadata: {},
    created_at: nowIso(),
  };
}

function fakeSession(email) {
  const nowSec = Math.floor(Date.now() / 1000);
  return {
    access_token: "e2e-access-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: nowSec + 3600,
    refresh_token: "e2e-refresh-token",
    user: fakeUser(email),
  };
}

// ---- Filter parsing (the narrow PostgREST subset this app actually uses) --

function applyFilters(rows, searchParams) {
  const skip = new Set(["select", "order", "limit", "offset", "on_conflict", "count"]);
  let result = rows;
  for (const [key, value] of searchParams.entries()) {
    if (skip.has(key)) continue;
    const [op, ...rest] = value.split(".");
    const target = rest.join(".");
    if (op === "eq") {
      result = result.filter((r) => String(r[key] ?? "") === target);
    } else if (op === "neq") {
      result = result.filter((r) => String(r[key] ?? "") !== target);
    } else if (op === "is" && target === "null") {
      result = result.filter((r) => r[key] === null || r[key] === undefined);
    }
  }
  return result;
}

function wantsSingle(req) {
  const accept = req.headers["accept"] ?? "";
  return accept.includes("vnd.pgrst.object");
}

// ---- REST: /rest/v1/<table> or /rest/v1/rpc/<fn> ---------------------------

async function handleRpc(fn, args, res) {
  if (fn === "bootstrap_household") {
    // null until this browser's test has created a household (matching
    // production behavior for a brand-new account — see
    // supabase/migrations/0006); the same id afterward, on every re-check.
    return send(res, 200, currentHouseholdId);
  }
  if (fn === "create_household") {
    const id = randomUUID();
    const ts = nowIso();
    tableRows("households").push({
      id,
      name: (args && args.p_name) || "Household",
      activeMode: null,
      createdAt: ts,
      updatedAt: ts,
    });
    currentHouseholdId = id;
    return send(res, 200, id);
  }
  // Not needed by the e2e flows (family invites, etc.) — defensive fallback.
  return send(res, 200, null);
}

async function handleRest(req, res, url) {
  const parts = url.pathname.replace(/^\/rest\/v1\//, "").split("/");

  if (parts[0] === "rpc") {
    const args = await readBody(req);
    return handleRpc(parts[1], args, res);
  }

  const table = parts[0];
  const rows = tableRows(table);

  if (req.method === "GET" || req.method === "HEAD") {
    const filtered = applyFilters(rows, url.searchParams);
    if (req.method === "HEAD") {
      // `.select(..., { count: "exact", head: true })` — a count-only probe,
      // no body, count read from Content-Range (PostgREST's own convention).
      res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Expose-Headers": "*",
        "Content-Range": `0-${Math.max(filtered.length - 1, 0)}/${filtered.length}`,
      });
      return res.end();
    }
    if (wantsSingle(req)) {
      if (filtered.length === 0) {
        return send(res, 406, { code: "PGRST116", message: "No rows found" });
      }
      return send(res, 200, filtered[0]);
    }
    return send(res, 200, filtered);
  }

  if (req.method === "POST") {
    const body = await readBody(req);
    // Rows the app builds itself already carry an id; a few seeded
    // singleton profiles deliberately omit it so Postgres's own
    // `default gen_random_uuid()` assigns one (see seed/cloud.ts's
    // `withoutId()`) — mirror that here instead of storing an id-less row.
    const incoming = (Array.isArray(body) ? body : [body].filter(Boolean)).map((row) => ({
      id: randomUUID(),
      ...row,
    }));
    const prefer = req.headers["prefer"] ?? "";
    const conflictCol = url.searchParams.get("on_conflict") || "id";

    if (prefer.includes("resolution=merge-duplicates")) {
      for (const row of incoming) {
        const idx = rows.findIndex((r) => r[conflictCol] === row[conflictCol]);
        if (idx >= 0) rows[idx] = { ...rows[idx], ...row };
        else rows.push(row);
      }
    } else {
      rows.push(...incoming);
    }
    return send(res, 201, incoming);
  }

  if (req.method === "PATCH") {
    const patch = await readBody(req);
    const filtered = applyFilters(rows, url.searchParams);
    for (const row of filtered) Object.assign(row, patch);
    return send(res, 200, filtered);
  }

  if (req.method === "DELETE") {
    const filtered = applyFilters(rows, url.searchParams);
    const removedIds = new Set(filtered.map((r) => r.id));
    const remaining = rows.filter((r) => !removedIds.has(r.id));
    tables.set(table, remaining);
    return send(res, 200, filtered);
  }

  return send(res, 405, { message: "Method not allowed" });
}

// ---- Auth: /auth/v1/* -------------------------------------------------------

async function handleAuth(req, res, url) {
  if (url.pathname === "/auth/v1/otp" && req.method === "POST") {
    return send(res, 200, {});
  }
  if (url.pathname === "/auth/v1/verify" && req.method === "POST") {
    const body = await readBody(req);
    return send(res, 200, fakeSession(body?.email ?? "e2e@example.com"));
  }
  if (url.pathname === "/auth/v1/user") {
    return send(res, 200, fakeUser("e2e@example.com"));
  }
  if (url.pathname === "/auth/v1/logout" && req.method === "POST") {
    return send(res, 204, undefined);
  }
  if (url.pathname === "/auth/v1/token") {
    return send(res, 200, fakeSession("e2e@example.com"));
  }
  return send(res, 200, {});
}

// ---- Storage: /storage/v1/* -------------------------------------------------

async function handleStorage(req, res, url) {
  if (url.pathname.includes("/object/sign/")) {
    return send(res, 200, { signedUrl: `http://127.0.0.1:${port}/fake-signed/${randomUUID()}` });
  }
  if (req.method === "DELETE") {
    return send(res, 200, []);
  }
  // Upload (POST/PUT to /storage/v1/object/<bucket>/<path>).
  return send(res, 200, { Key: url.pathname });
}

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    return send(res, 204, undefined);
  }
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  if (process.env.MOCK_SUPABASE_DEBUG) {
    console.log(`[mock-supabase] ${req.method} ${url.pathname}${url.search}`);
  }
  try {
    if (url.pathname === "/__reset" && req.method === "POST") {
      // Playwright runs this suite with a single worker, but state still
      // persists across specs within one run (same server process) — each
      // spec resets to a clean slate first so it doesn't inherit the
      // previous spec's already-onboarded household.
      tables.clear();
      currentHouseholdId = null;
      return send(res, 200, {});
    }
    if (url.pathname.startsWith("/rest/v1/")) return await handleRest(req, res, url);
    if (url.pathname.startsWith("/auth/v1/")) return await handleAuth(req, res, url);
    if (url.pathname.startsWith("/storage/v1/")) return await handleStorage(req, res, url);
    return send(res, 200, {});
  } catch (err) {
    send(res, 500, { message: err instanceof Error ? err.message : "mock server error" });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`[mock-supabase] listening on http://127.0.0.1:${port}`);
});
