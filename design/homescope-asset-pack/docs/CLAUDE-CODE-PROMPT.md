You are working inside my existing HomeScope Next.js application.

I have provided a visual asset pack. Copy its contents into:

public/images/homescope/

Expected structure:

public/images/homescope/
├── backgrounds/
│   ├── landing/
│   │   ├── landing-light.png
│   │   ├── landing-light.webp
│   │   ├── landing-dark.png
│   │   └── landing-dark.webp
│   └── app/
│       ├── app-light.png
│       ├── app-light.webp
│       ├── app-dark.png
│       └── app-dark.webp
├── illustrations/
│   ├── buyer/
│   │   ├── buyer-light.png
│   │   ├── buyer-light.webp
│   │   ├── buyer-dark.png
│   │   └── buyer-dark.webp
│   └── homeowner/
│       ├── homeowner-light.png
│       ├── homeowner-light.webp
│       ├── homeowner-dark.png
│       └── homeowner-dark.webp
└── icons/
    ├── light/
    └── dark/

Before changing anything, inspect the repository and identify:

- App Router or Pages Router
- Existing theme system
- Existing design tokens
- Existing navbar, card, button, icon, and layout components
- Existing routes and authentication logic
- Buyer and homeowner onboarding logic
- Current responsive breakpoints and container widths

Do not create a second theme system. Reuse the existing one.
Do not change business logic, authentication behavior, database behavior, or routes unless required to fix an existing visual bug.

OBJECTIVE

Redesign the public landing page, onboarding path-selection page, buyer workspace, homeowner workspace, Journey, Homes, Notes, Documents, and Toolkit surfaces so the app feels calm, premium, warm, and personal.

The product should remain notes-first. Do not turn it into a real-estate marketplace or an auto-populated financial dashboard.

ASSET RULES

1. Prefer the included WebP assets in the UI.
2. Keep PNG files as fallbacks and source assets.
3. Use Next.js Image where appropriate.
4. Decorative images must use empty alt text.
5. Do not stretch images.
6. Use object-cover for backgrounds and object-contain for illustrations.
7. Do not use raster icon images for tiny 16–20px controls when an existing Lucide icon already works better.
8. Use the supplied icon images for feature cards, empty states, onboarding cards, and hero decorations.
9. Do not place every image on every screen. Use them selectively.

THEME MAPPING

Light mode:
- landing background: /images/homescope/backgrounds/landing/landing-light.webp
- app background: /images/homescope/backgrounds/app/app-light.webp
- buyer illustration: /images/homescope/illustrations/buyer/buyer-light.webp
- homeowner illustration: /images/homescope/illustrations/homeowner/homeowner-light.webp
- feature icons: /images/homescope/icons/light/

Dark mode:
- landing background: /images/homescope/backgrounds/landing/landing-dark.webp
- app background: /images/homescope/backgrounds/app/app-dark.webp
- buyer illustration: /images/homescope/illustrations/buyer/buyer-dark.webp
- homeowner illustration: /images/homescope/illustrations/homeowner/homeowner-dark.webp
- feature icons: /images/homescope/icons/dark/

PUBLIC LANDING PAGE

Build one large scrolling page with three sections:

1. Home
2. Why HomeScope
3. How it works

Use a transparent floating navbar with:
- HomeScope logo
- Home
- Why HomeScope
- How it works
- theme toggle
- Log in

Navbar links should smoothly scroll to sections on the same page.
Use scroll-margin-top so headings are not hidden by the sticky navbar.
Highlight the current section using IntersectionObserver.
Respect prefers-reduced-motion.

The landing page should show:
- large readable hero text
- Get started
- Log in
- privacy reassurance
- Why HomeScope card
- How it works card
- notes-first feature strip

Do not show buyer/homeowner selection on every visit.
Only show that selection after a new user clicks Get started.
Returning authenticated users should go directly to their saved workspace.

ONBOARDING PATH SELECTION

Redesign the existing “How are you using HomeScope?” page.

Use:
- buyer illustration on the buyer card
- homeowner illustration on the homeowner card
- larger cards
- stronger selected states
- larger text
- clear Continue button
- centered content at a comfortable width

Do not change the path-selection logic.
Do not force returning users to choose again.

BUYER EXPERIENCE

Use the buyer illustration sparingly in:
- buyer onboarding
- buyer empty state
- Journey welcome state

Do not use it as a full-page background behind dense content.

Improve:
- Journey stage navigation
- current-step card
- notes area
- readiness panel
- homes list
- property detail
- Toolkit

Keep all existing data and actions.

HOMEOWNER EXPERIENCE

Use the homeowner illustration sparingly in:
- homeowner onboarding
- HomeBase empty state
- maintenance welcome state

Improve:
- maintenance overview
- repair history
- recurring tasks
- documents
- warranties
- home notes

Keep all existing data and actions.

GLOBAL APP BACKGROUND

Use the app background as a low-opacity decorative fixed visual layer behind authenticated pages.

Requirements:
- pointer-events: none
- aria-hidden
- subtle theme-aware overlay
- center content remains readable
- no background-attachment: fixed
- no layout shift
- no image behind form fields at high contrast
- cards must have solid enough surfaces for readability

Use CSS variables tied to the existing theme selector.

Example direction:

:root {
  --homescope-app-bg: url("/images/homescope/backgrounds/app/app-light.webp");
}

.dark {
  --homescope-app-bg: url("/images/homescope/backgrounds/app/app-dark.webp");
}

Do not copy this blindly if the project uses data-theme attributes.

VISUAL SYSTEM

Light mode:
- warm ivory background
- charcoal text
- muted slate secondary text
- teal primary accent
- restrained warm gold secondary accent
- warm white cards, not pure white everywhere

Dark mode:
- deep navy-black background
- soft off-white text
- cool gray secondary text
- teal primary accent
- warm gold secondary accent
- dark translucent cards with strong readability

Typography:
- increase body and heading sizes
- use responsive clamp values or existing fluid typography
- do not let the app become tiny on a 27-inch display
- avoid oversized marketing typography inside authenticated pages

Layout:
- max content width around 1280–1360px
- responsive horizontal padding
- stack cards on narrow screens
- avoid fixed heights
- remove unnecessary page-level scrollbars
- no horizontal scrolling
- test browser zoom at 200%

Cards:
- subtle border
- restrained radius
- light backdrop blur where supported
- readable fallback background
- no giant glow
- no continuous floating effects
- hover movement no more than 2–3px

ANIMATION

Use subtle:
- section reveal
- card fade and slight rise
- arrow movement on hover
- smooth anchor scrolling
- current-section navbar indicator

Do not add:
- particles
- Three.js
- cursor-following
- heavy parallax
- large animation libraries solely for this redesign

ACCESSIBILITY

- semantic landmarks
- one h1 per page
- visible keyboard focus
- 44px touch targets
- sufficient contrast
- descriptive alt text for meaningful illustrations
- empty alt text for decorative imagery
- reduced-motion support
- keyboard-accessible cards and navigation

PERFORMANCE

- use the WebP assets
- set correct sizes
- avoid eager-loading every image
- prioritize only the landing hero background if needed
- prevent cumulative layout shift
- preserve server rendering
- do not add JavaScript for image resizing
- do not render both light and dark full-resolution backgrounds visibly at once

IMPORTANT LOGIC RULES

- Keep existing authentication behavior.
- Keep existing onboarding behavior.
- Keep existing buyer/homeowner preference persistence.
- Do not make users choose buyer/homeowner every time.
- Do not delete or migrate user data.
- Do not modify Supabase schema.
- Do not replace working components unnecessarily.
- Do not redesign unrelated backend code.

VALIDATION

After implementation:
- run formatter
- run lint
- run TypeScript checks
- run tests
- run production build
- verify all image paths
- verify no 404s
- verify light and dark mode
- verify MacBook, 27-inch monitor, tablet, and mobile layouts
- verify there is no horizontal scroll
- verify there are no unnecessary nested scrollbars
- verify login and onboarding routes
- verify returning users bypass path selection

At the end provide:
- files changed
- components reused
- routes preserved
- assets used on each screen
- theme-switching implementation
- commands run and results

Do not merely describe the redesign. Inspect the repository and implement it.
