> **Note (Phase 1 of the visual redesign):** This pack was split up during Phase 1.
> The WebP images the app actually references, plus the icon PNGs (no WebP
> alternative exists for those), now live under `public/images/homescope/`.
> This directory (`design/homescope-asset-pack/`) keeps everything else for
> reference only — the PNG masters behind those WebPs, the mockups, the
> source icon sheets, and the implementation-prompt doc below. The rest of
> this README describes the pack's original, pre-split layout and is now
> partly out of date (e.g. "Recommended copy destination" and the "Lucide
> icon system" mention — this app has no Lucide, every icon is a hand-rolled
> inline SVG); a full rewrite is out of scope for this fix.

# HomeScope Visual Asset Pack

This package contains theme-specific backgrounds, buyer and homeowner illustrations,
individual feature icons, design-reference mockups, and a Claude Code implementation prompt.

## Recommended copy destination

Copy these folders into:

`public/images/homescope/`

## Folder overview

- `backgrounds/landing/` — public marketing landing page
- `backgrounds/app/` — subtle authenticated-app backdrop
- `illustrations/buyer/` — buyer onboarding and empty states
- `illustrations/homeowner/` — homeowner onboarding and empty states
- `icons/light/` — individual light-theme feature icons
- `icons/dark/` — individual dark-theme feature icons
- `mockups/` — visual references only; do not ship all of them in production
- `source-sheets/` — original icon sheets
- `docs/CLAUDE-CODE-PROMPT.md` — full implementation prompt

## Important note about icons

The icon PNGs were cropped from generated icon sheets. They are intended for larger
feature cards and onboarding visuals. For small interface controls, use the app’s existing
SVG/Lucide icon system for sharper rendering and accessibility.

## Formats

Large backgrounds and illustrations are provided as both PNG and optimized WebP.
Use WebP in the application and keep PNG as a source/fallback.
