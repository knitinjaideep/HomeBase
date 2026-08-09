# HomeScope Visual Redesign — Phase 1: Foundation

## Context

A visual asset pack (theme-aware backgrounds, buyer/homeowner illustrations, feature icons,
and design-reference mockups) was dropped at `~/Downloads/homescope_visual_asset_pack/` and,
separately, its raw contents were already extracted into `public/images/homescope/` (untracked).
It comes with an implementation brief (`docs/CLAUDE-CODE-PROMPT.md` inside the pack) describing
a full visual redesign of the public landing page, onboarding path-selection, buyer workspace,
homeowner workspace, and the Journey/Homes/Notes/Documents/Toolkit surfaces.

That scope spans ~9 largely independent areas — too large for one spec, plan, or PR, and it
cuts against this repo's CLAUDE.md preference for small, reviewable changes. The work is being
decomposed into phases, each with its own design → plan → implementation → commit cycle:

1. **Foundation** (this spec) — asset cleanup, design-token reconciliation, global authenticated
   app background.
2. Public landing page.
3. Onboarding path-selection.
4. Global app-shell/component visual polish (nav, buttons, cards).
5. Buyer workspace (Journey, Homes/properties, Toolkit).
6. Homeowner workspace (HomeBase/maintenance, repair history, documents, warranties).
7. Shared surfaces (Notes, Documents).
8. Accessibility/animation/performance polish pass + full validation.

This document specs **Phase 1 only**.

## Architecture context (as found)

- App Router, `src/app/`. Authenticated pages live under the `(app)` route group;
  `src/app/(app)/layout.tsx` composes `HouseholdProvider` → `WorkspaceGate` → `AppShell`.
- Theme system is custom (no `next-themes`): a `.dark` class on `<html>`, toggled via
  `src/lib/theme.ts` (localStorage-backed) and a pre-paint inline script in `src/app/layout.tsx`.
  Design tokens are CSS variables in `src/app/globals.css` (`:root` = light, `.dark` = dark),
  consumed through Tailwind's `rgb(var(--x) / <alpha-value>)` pattern
  (`tailwind.config.ts`). A separate `data-mode="buying"|"owning"` attribute (set by
  `AppShell`) drives the buyer/homeowner accent color independently of light/dark.
- `AppShell` (`src/components/app-shell.tsx`) wraps every authenticated page: `AppNav` +
  banners + `<main class="mx-auto max-w-content ...">` + footer + `BottomNav` + `QuickNote`.
  It does **not** wrap the pre-mode-selection onboarding screen (`WorkspaceGate` renders that
  in place of `AppShell`) or the public marketing pages.
- Existing tokens already closely match the asset pack's target visual system (warm ivory /
  charcoal / teal in light, navy-charcoal / off-white / teal in dark) — no palette rebuild
  needed.
- `maxWidth.content = "72rem"` (1152px) is the one canonical content-width token, used by
  `AppNav`, `AppShell`'s `<main>` and footer, `BottomNav`, and the public landing page.
- No Lucide or any icon library — every icon in the app is a hand-rolled inline SVG local to
  its component. The pack's raster icons are for feature cards / onboarding / empty states,
  not a replacement for existing nav icons (out of scope for this phase either way).
- `public/images/landing/{landing-light,landing-dark}.png` + `.landing-page` /
  `.landing-page__sparkles` CSS in `globals.css` is a **pre-existing**, currently-wired
  marketing background system, separate from the new asset pack. Left untouched in this
  phase; reconciling it is Phase 2's concern.

## Decisions

1. **Asset cleanup**: `public/images/homescope/` currently also contains `mockups/`,
   `source-sheets/`, `manifest.json`, `README.md`, `docs/CLAUDE-CODE-PROMPT.md`, and duplicate
   flat icon folders (`light/`, `dark/`, loose root PNGs) — none used by the app, and
   everything under `public/` is served as static files in production. Reference material
   moves to `design/homescope-asset-pack/` (not under `public/`, so nothing extra ships);
   duplicates are deleted.
2. **Content width**: add a new `content-wide` Tailwind maxWidth token (~1320px) alongside the
   existing `content` (1152px). Nothing that currently uses `max-w-content` changes width in
   this phase — later phases opt individual redesigned pages into the wider token deliberately.
3. **Secondary/gold accent**: add `--secondary` / `--secondary-soft` CSS variables (same RGB
   values already used for `--caution` / owning-mode accent) for decorative use in later
   phases (e.g. a "How it works" card). Kept separate from `--caution` so a decorative choice
   never shares a variable with a semantic warning color.
4. **Global app background**: implemented as CSS (background-image via a new
   `--homescope-app-bg` variable, swapped in the existing `:root`/`.dark` blocks), not
   `next/image` — this is a single fixed decorative layer with no responsive-sizing need, and
   `next/image` would add complexity (and a DOM node) for no benefit here.

## Scope

**In scope:**
- Move/delete non-shipping reference material out of `public/`.
- Add three new CSS/Tailwind tokens (additive; nothing existing is modified).
- Add one decorative background layer to `AppShell`.

**Out of scope (explicitly deferred to later phases):**
- Public landing page, onboarding path-selection, any workspace surface (Journey, Homes,
  Notes, Documents, Toolkit, maintenance, etc.).
- The pre-existing `.landing-page` background/sparkle system.
- Any use of the illustrations or feature icons.
- Any component visual redesign (nav, buttons, cards, typography scale).

## Design

### 1. Asset file layout

```
public/images/homescope/
├── backgrounds/
│   ├── app/{app-light,app-dark}.{png,webp}       (kept — used this phase)
│   └── landing/{landing-light,landing-dark}.{png,webp}  (kept — unused until Phase 2)
├── illustrations/
│   ├── buyer/{buyer-light,buyer-dark}.{png,webp}       (kept — unused until later phases)
│   └── homeowner/{homeowner-light,homeowner-dark}.{png,webp}
└── icons/
    ├── light/*.png   (kept — unused until later phases)
    └── dark/*.png

design/homescope-asset-pack/          (new, outside public/ — not publicly served)
├── README.md
├── manifest.json
├── docs/CLAUDE-CODE-PROMPT.md
├── mockups/*.png
└── source-sheets/*.png
```

Removed entirely: `public/images/homescope/{light,dark}/` (duplicate flat icon folders),
loose root-level icon PNGs, and stray `.DS_Store` files.

### 2. Tokens

`tailwind.config.ts` — add alongside the existing `maxWidth.content`:
```ts
maxWidth: {
  content: "72rem",
  "content-wide": "82.5rem", // 1320px — opt-in per redesigned surface, later phases
},
```

`src/app/globals.css` — add to the existing `:root` block:
```css
--secondary: 158 106 24;
--secondary-soft: 250 240 219;
--homescope-app-bg: url("/images/homescope/backgrounds/app/app-light.webp");
```
and to the existing `.dark` block:
```css
--secondary: 214 170 96;
--secondary-soft: 54 45 26;
--homescope-app-bg: url("/images/homescope/backgrounds/app/app-dark.webp");
```

`tailwind.config.ts` `colors` — add `secondary` / `secondary-soft` following the existing
`rgb(var(--x) / <alpha-value>)` pattern used by every other color token.

### 3. Global app background

A new small component, e.g. `src/components/app-background.tsx`:

```tsx
export function AppBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 bg-app-backdrop"
    />
  );
}
```

with the actual image + tint composed via a Tailwind arbitrary-value utility or a small CSS
rule so light/dark tint strength can differ (light needs a much stronger canvas tint than dark,
since both source images are dark, moody night scenes with teal/gold light-trail accents —
verified by inspecting the actual PNGs, not assumed):

```css
.bg-app-backdrop {
  background-image:
    linear-gradient(rgb(var(--canvas) / 0.94), rgb(var(--canvas) / 0.94)),
    var(--homescope-app-bg);
  background-size: cover;
  background-position: center;
}
.dark .bg-app-backdrop {
  background-image:
    linear-gradient(rgb(var(--canvas) / 0.78), rgb(var(--canvas) / 0.78)),
    var(--homescope-app-bg);
}
```

Rendered as the first child inside `AppShell`'s root `<div>`, before `AppNav`. `position:
fixed` means it doesn't participate in layout (no CLS) and isn't affected by the root div's
existing safe-area padding. `Panel` (the card primitive) is already fully opaque
(`bg-surface`), so no changes are needed there for readability — cards already sit solidly on
top of the new layer.

This only ever affects authenticated `(app)` pages (everything rendered inside `AppShell`); it
does not reach the public landing page, login, or the pre-mode-selection onboarding screen.

## Testing

No automated visual tests exist for this (Vitest covers logic, Playwright covers the buyer/
homeowner e2e flows — neither asserts on background styling). Validation is:
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- Manual: toggle light/dark on a couple of authenticated pages, confirm no layout shift, no
  horizontal scroll, background doesn't obscure form fields or reduce text contrast, and that
  all new image paths resolve (no 404s in Network tab).

## Risks / notes

- Tint values (0.94 / 0.78) are a starting point based on visual inspection of the source
  PNGs; final numbers may need a small adjustment once seen live in the browser — this is a
  one-line CSS change either way, not a design change.
- This phase does not change how any existing page looks by more than a faint background tint
  — it's intentionally low-risk groundwork for the phases that follow.
