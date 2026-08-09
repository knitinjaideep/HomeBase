# HomeScope Redesign Phase 1: Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up the visual asset pack so only what the app uses ships under `public/`, add three new design tokens without touching any existing token, and add a low-opacity decorative background layer behind authenticated pages — with zero visual or behavioral change to any existing page beyond that faint backdrop.

**Architecture:** Pure CSS/Tailwind-token additions plus one new presentational component (`AppBackground`) rendered inside the existing `AppShell`. No new dependencies, no business-logic changes, no routes touched.

**Tech Stack:** Next.js App Router, Tailwind CSS (`darkMode: "class"`), Vitest (`renderToStaticMarkup`, node environment, no jsdom).

## Global Constraints

- Do not modify any existing CSS variable value or any existing Tailwind token — all changes are additive (spec §Decisions 2–4).
- Do not touch the public landing page, onboarding, or any workspace surface — out of scope for this phase (spec §Scope).
- Do not touch the pre-existing `.landing-page` / `.landing-page__sparkles` background system (spec §Scope).
- No new npm dependencies (`next/image` deliberately not used for the backdrop — spec §Decisions 4).
- Follow existing patterns: `.dark <selector>` scoping for theme-swapped CSS (not `dark:` Tailwind variants, not a `data-theme` attribute), `rgb(var(--x) / <alpha-value>)` for any new Tailwind color token, `hs-` prefix for new custom CSS classes (matches `.hs-input`, `.hs-card-interactive`, `.hs-sparkle`).
- No `@ts-ignore`/`@ts-nocheck`. No meaningless tests — only add a test file where the component is new and the test asserts real behavior (per CLAUDE.md; this repo already follows this — no test exists today for `app-shell.tsx` and this plan does not add one for it, since the only change there is a one-line render addition with no new logic).
- Validation commands for every task: `npm run lint`, `npm run typecheck`; full suite (`npm run build`, `npm test`) at the end per task 5.
- Never run `git push`, `git merge`, `gh pr create`, or any destructive git command. Local `git add`/`git commit` only, and only when explicitly confirmed with the user first (see execution handoff).

---

## Task 1: Reorganize the asset pack — strip non-shipping files out of `public/`

**Files:**
- Move: `public/images/homescope/README.md` → `design/homescope-asset-pack/README.md`
- Move: `public/images/homescope/manifest.json` → `design/homescope-asset-pack/manifest.json`
- Move: `public/images/homescope/docs/CLAUDE-CODE-PROMPT.md` → `design/homescope-asset-pack/docs/CLAUDE-CODE-PROMPT.md`
- Move: `public/images/homescope/mockups/` (11 PNGs) → `design/homescope-asset-pack/mockups/`
- Move: `public/images/homescope/source-sheets/` (2 PNGs) → `design/homescope-asset-pack/source-sheets/`
- Delete: `public/images/homescope/CLAUDE-CODE-PROMPT.md` (loose duplicate of the `docs/` copy)
- Delete: `public/images/homescope/light/`, `public/images/homescope/dark/` (flat duplicates of `icons/light/`, `icons/dark/`)
- Delete: `public/images/homescope/{calendar-check,calendar,documents,file-record,home-search-settings,home,notes,privacy-shield,questions}.png` (loose root duplicates of the `icons/*` files)
- Delete: every `.DS_Store` under `public/images/homescope/`

**Interfaces:** None — this task has no code dependencies and nothing later depends on its internals beyond the final directory shape, which Task 2+ reference by path string only (`/images/homescope/backgrounds/app/app-light.webp` etc., unaffected by this task).

- [ ] **Step 1: Move the reference material**

```bash
mkdir -p design/homescope-asset-pack/docs
mv public/images/homescope/README.md design/homescope-asset-pack/README.md
mv public/images/homescope/manifest.json design/homescope-asset-pack/manifest.json
mv public/images/homescope/docs/CLAUDE-CODE-PROMPT.md design/homescope-asset-pack/docs/CLAUDE-CODE-PROMPT.md
mv public/images/homescope/mockups design/homescope-asset-pack/mockups
mv public/images/homescope/source-sheets design/homescope-asset-pack/source-sheets
rmdir public/images/homescope/docs
```

- [ ] **Step 2: Delete duplicates**

```bash
rm public/images/homescope/CLAUDE-CODE-PROMPT.md
rm -rf public/images/homescope/light public/images/homescope/dark
rm public/images/homescope/calendar-check.png public/images/homescope/calendar.png \
   public/images/homescope/documents.png public/images/homescope/file-record.png \
   public/images/homescope/home-search-settings.png public/images/homescope/home.png \
   public/images/homescope/notes.png public/images/homescope/privacy-shield.png \
   public/images/homescope/questions.png
find public/images/homescope -name ".DS_Store" -delete
```

- [ ] **Step 3: Verify the resulting shape**

```bash
find public/images/homescope -maxdepth 3 | sort
```

Expected: only `backgrounds/app/*`, `backgrounds/landing/*`, `illustrations/buyer/*`,
`illustrations/homeowner/*`, `icons/light/*`, `icons/dark/*` (33 files total, no
`.DS_Store`, no `mockups`/`source-sheets`/`docs`/`manifest.json`/`README.md`, no `light/`
or `dark/` at the top level, no loose PNGs at the top level).

```bash
find design/homescope-asset-pack | sort
```

Expected: `README.md`, `manifest.json`, `docs/CLAUDE-CODE-PROMPT.md`, `mockups/` (11 PNGs),
`source-sheets/` (2 PNGs).

- [ ] **Step 4: Stage the result (no commit yet — see execution handoff)**

```bash
git add public/images/homescope design/homescope-asset-pack
git status --short
```

Confirm the status output shows the new `design/homescope-asset-pack/` paths and the
now-smaller `public/images/homescope/` tree, with no unexpected paths.

---

## Task 2: Add design tokens and the app-backdrop CSS rule

**Files:**
- Modify: `tailwind.config.ts` (add `content-wide` maxWidth, `secondary`/`secondary-soft` colors)
- Modify: `src/app/globals.css` (add `--secondary`/`--secondary-soft` to `:root`/`.dark`; add new `.hs-app-backdrop` / `.dark .hs-app-backdrop` rule)

**Interfaces:**
- Produces: Tailwind utility classes `max-w-content-wide`, `text-secondary`, `bg-secondary`,
  `border-secondary`, `bg-secondary-soft` (and any other Tailwind color utility suffix) for
  later phases to consume. Produces CSS class `hs-app-backdrop` for Task 3's component to use.
- Consumes: existing `--canvas` variable (already defined in both `:root` and `.dark`).

- [ ] **Step 1: Add the two new color tokens to `tailwind.config.ts`**

In the `colors` object (after the existing `critical` line), add:

```ts
        secondary: "rgb(var(--secondary) / <alpha-value>)",
        "secondary-soft": "rgb(var(--secondary-soft) / <alpha-value>)",
```

In the `maxWidth` object, change:

```ts
      maxWidth: {
        content: "72rem",
      },
```

to:

```ts
      maxWidth: {
        content: "72rem",
        "content-wide": "82.5rem",
      },
```

- [ ] **Step 2: Add the CSS variables to `src/app/globals.css`**

In the existing `:root` block, immediately after the `--critical: 168 68 51;` line, add:

```css
  --secondary: 158 106 24;
  --secondary-soft: 250 240 219;
```

In the existing `.dark` block, immediately after the `--critical: 224 138 120;` line, add:

```css
  --secondary: 214 170 96;
  --secondary-soft: 54 45 26;
```

- [ ] **Step 3: Add the `.hs-app-backdrop` rule to `src/app/globals.css`**

Immediately after the `.hs-sparkle` keyframes block (right before the `body { ... }` rule),
add:

```css
/* Global authenticated-app background: a faint, fixed decorative layer behind
   every (app) page. A CSS background (not next/image) so only the active
   theme's image is ever fetched, matching the .landing-page pattern above.
   Both source images are dark, moody night scenes with teal/gold light-trail
   accents (not neutral textures), so the light-mode tint must be much
   stronger than dark's to avoid a jarring dark wash under the ivory canvas —
   confirmed by inspecting the actual images, not assumed. */
.hs-app-backdrop {
  --app-backdrop-image: url("/images/homescope/backgrounds/app/app-light.webp");
  --app-backdrop-tint: rgb(var(--canvas) / 0.94);
  position: fixed;
  inset: 0;
  z-index: -10;
  pointer-events: none;
  background-image: linear-gradient(var(--app-backdrop-tint), var(--app-backdrop-tint)),
    var(--app-backdrop-image);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.dark .hs-app-backdrop {
  --app-backdrop-image: url("/images/homescope/backgrounds/app/app-dark.webp");
  --app-backdrop-tint: rgb(var(--canvas) / 0.78);
}
```

- [ ] **Step 4: Verify**

```bash
npm run typecheck
npm run lint
npm run build
```

Expected: all three succeed with no new errors or warnings. Then confirm the new CSS rule
made it into the production bundle (custom CSS classes are always included, unlike
Tailwind utilities which are only emitted where referenced):

```bash
grep -rl "hs-app-backdrop" .next/static/css/*.css
```

Expected: one matching file path printed (not empty).

- [ ] **Step 5: Commit (only after user confirms — see execution handoff)**

```bash
git add tailwind.config.ts src/app/globals.css
git commit -m "Add secondary accent, wide-content, and app-backdrop tokens"
```

---

## Task 3: Create the `AppBackground` component

**Files:**
- Create: `src/components/app-background.tsx`
- Test: `src/components/app-background.test.tsx`

**Interfaces:**
- Consumes: nothing (no props, no context, no hooks).
- Produces: `AppBackground` — a named export, zero-prop React component, for Task 4 to
  render inside `AppShell`.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AppBackground } from "./app-background";

describe("AppBackground", () => {
  it("renders a decorative, non-interactive backdrop", () => {
    const html = renderToStaticMarkup(<AppBackground />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("hs-app-backdrop");
  });

  it("renders no text content", () => {
    const html = renderToStaticMarkup(<AppBackground />);
    expect(html.replace(/<[^>]*>/g, "").trim()).toBe("");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/components/app-background.test.tsx
```

Expected: FAIL — `Cannot find module './app-background'` (the component doesn't exist yet).

- [ ] **Step 3: Write the component**

```tsx
export function AppBackground() {
  return <div aria-hidden="true" className="hs-app-backdrop" />;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/components/app-background.test.tsx
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit (only after user confirms — see execution handoff)**

```bash
git add src/components/app-background.tsx src/components/app-background.test.tsx
git commit -m "Add AppBackground decorative backdrop component"
```

---

## Task 4: Wire `AppBackground` into `AppShell`

**Files:**
- Modify: `src/components/app-shell.tsx`

**Interfaces:**
- Consumes: `AppBackground` (named export, zero props) from Task 3's
  `src/components/app-background.tsx`.

- [ ] **Step 1: Import and render `AppBackground` as the first child**

In `src/components/app-shell.tsx`, add the import:

```tsx
import { AppBackground } from "./app-background";
```

Change the root return to render `AppBackground` first, before `AppNav`:

```tsx
    <div
      data-mode={mode}
      className="flex min-h-screen flex-col"
      style={{ paddingLeft: "env(safe-area-inset-left)", paddingRight: "env(safe-area-inset-right)" }}
    >
      <AppBackground />
      <AppNav mode={mode} />
```

(Everything else in the file is unchanged.) `position: fixed` on `.hs-app-backdrop` means
this render position doesn't affect flex layout of the other children — it's purely where
the component is declared in the tree, not where it visually sits.

- [ ] **Step 2: Verify**

```bash
npm run typecheck
npm run lint
npm run build
```

Expected: all three succeed with no new errors.

- [ ] **Step 3: Manual smoke check**

```bash
npm run dev
```

Visit any authenticated page (e.g. `/journey` or `/homebase`, logging in first if needed).
Confirm:
- A faint background image is visible behind the page content in both light and dark mode
  (toggle via the existing theme toggle).
- No layout shift, no new horizontal scrollbar.
- Form fields and card text remain fully readable (cards are opaque `bg-surface`, so this
  should already hold).
- Network tab shows the correct `app-light.webp` / `app-dark.webp` request with a 200, no
  404s, and switching theme does not re-fetch the inactive theme's image (CSS `.dark`
  selector means only the active image is ever referenced by the applied rule).

- [ ] **Step 4: Commit (only after user confirms — see execution handoff)**

```bash
git add src/components/app-shell.tsx
git commit -m "Render AppBackground behind every authenticated page"
```

---

## Task 5: Full validation pass

**Files:** None (verification only).

- [ ] **Step 1: Run the full validation suite**

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Expected: all four succeed. Report any failures before proceeding — do not weaken checks to
force a pass (per CLAUDE.md).

- [ ] **Step 2: Re-run the manual checklist from Task 4 Step 3 once more end-to-end**

Light mode and dark mode, on at least two different authenticated routes (e.g. `/journey`
and `/homebase`, or whichever the logged-in test account has access to), confirming: no
horizontal scroll, no layout shift, background doesn't reduce text/form contrast, no image
404s.

- [ ] **Step 3: Confirm out-of-scope surfaces are visually unchanged**

Spot-check the public landing page (`/`) and, if reachable, the pre-mode-selection
onboarding screen — neither should show any visual change from this phase (per spec
§Scope, `AppBackground` is only rendered inside `AppShell`, which doesn't wrap either).

---

## Self-Review Notes

- **Spec coverage:** Asset cleanup → Task 1. Content-width token → Task 2 Step 1.
  Secondary/gold token → Task 2 Steps 1–2. Global app background (CSS approach, tint
  strategy, `AppShell` placement, no `next/image`, no CLS, opaque cards already sufficient)
  → Task 2 Step 3, Task 3, Task 4. Validation commands from spec §Testing → Task 5.
  Out-of-scope boundary (landing page, onboarding, `.landing-page` system untouched) →
  Global Constraints + Task 5 Step 3.
- **Placeholder scan:** none found — every step has literal code/commands and exact expected
  output.
- **Type consistency:** `AppBackground` is a zero-prop named export in both its definition
  (Task 3) and its only call site (Task 4) — no signature drift.
