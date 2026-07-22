# 03 — Design System

## Colors
CSS custom properties, used identically across every screen (defined in each file's <helmet>):

| Token | Hex | Usage |
|---|---|---|
| --ink | #0B140F | Primary text, dark surfaces (sidebars, footers) |
| --paper | #F6F5F0 | Page background (warm off-white) |
| --white | #FFFFFF | Card/panel surfaces |
| --green | #0E5C43 | Primary brand color — primary buttons, active nav, links |
| --green-deep | #093C2C | Hover state for green, dark-green panels (auth brand panel, sidebars) |
| --green-soft | #E3EDE7 | Soft tinted backgrounds (badges, AI insight callouts, success banners) |
| --green-line | #C9DBD1 | Chart bars, subtle green borders |
| --clay | #DB6B3B | Secondary accent — CTA buttons ("Book a Demo"), highlights, warnings-adjacent emphasis |
| --clay-soft | #F5E4DA | Soft clay tint backgrounds |
| --success | #1E9E5A | Success states, paid/completed statuses |
| --warning | #E0A008 | Warning states, pending/due-soon statuses |
| --error | #CF4B3E | Error states, overdue/failed statuses |
| --stone | #5C665F | Secondary/muted text |
| --line | #E4E2DA | Default border color |
| --line-2 | #D8D6CD | Input borders, slightly stronger than --line |

Soft-tint pattern: error/warning banners use `rgba(207,75,62,.08)` bg + `rgba(207,75,62,.25)` border + `var(--error)` text (same formula for warning, swap the RGB). Success uses `--green-soft` bg + `--green-deep` text.

**Do not introduce new colors.** For any additional semantic need, use oklch adjustments of hue only, keeping the same lightness/chroma as the existing accents (per brand guidance) — but flag to design first.

## Typography
Three fonts, loaded from Google Fonts:

| Font | Role | Weights used |
|---|---|---|
| Schibsted Grotesk | Display / headings (h1–h3, card titles, key numbers) | 600, 700, 800, 900 |
| Hanken Grotesk | Body copy, labels, UI text | 300, 400, 500, 600, 700 |
| JetBrains Mono | Data/numeric values, timestamps, currency, status labels, section eyebrows | 400, 500, 600 |

Type scale (as implemented; use clamp() on marketing pages for fluid sizing, fixed px in dashboards):
- Marketing H1: 34–58px / weight 800 / letter-spacing -0.03em
- Section H2: 24–42px / weight 700 / letter-spacing -0.02em
- Dashboard page title: 19–24px / weight 700
- Card title: 15–17px / weight 600
- Body: 14–17px / weight 400, line-height 1.5–1.65
- Small/meta: 11–13px / weight 500, often var(--stone)
- Mono data (amounts, timestamps): JetBrains Mono, 10–20px depending on context, weight 600 for emphasis

## Spacing
No formal 4/8px grid was enforced as a strict token system, but usage clusters around: 4, 6, 8, 9, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 40, 48, 56, 64px. Standardize on an **8px base scale (4/8/12/16/20/24/32/40/48/64)** when rebuilding — round each prototype value to the nearest step.

## Grid
- Marketing pages: centered content, max-width 900–1240px depending on section, fluid padding via clamp(20px,4vw,64px).
- Dashboards: fixed sidebar (230px expanded / ~72px collapsed) + fluid content area, KPI cards in a 3–4 column CSS grid with 10–16px gap, collapsing via auto-fit/minmax on narrower widths.

## Border Radius
| Context | Radius |
|---|---|
| Buttons, inputs | 9–10px |
| Cards, modals | 12–22px (larger radius for larger/hero cards) |
| Pills/badges/chips | 99px (full pill) |
| Avatars | 50% (circle) |

## Shadows
Used sparingly (brand guidance: avoid heavy shadow use). The one recurring elevation shadow:
`box-shadow: 0 24px 60px -30px rgba(11,20,15,.2)` — used on lifted cards (dashboard preview mockups, auth form cards, modals). Most cards instead rely on a **1px solid var(--line) border**, not a shadow, for separation. Modal backdrops use a plain semi-opaque dark scrim (`rgba(11,20,15,.5)`), no blur.

## Buttons
- **Primary**: background var(--green), color #fff, border-radius 10px, padding ~14px, weight 600; hover -> var(--green-deep)
- **Secondary/Outline**: background none, border 1.5px solid var(--line-2), color var(--ink); hover -> border var(--ink)
- **Accent/CTA** (marketing "Book a Demo"): background var(--clay), color #fff; hover -> darker clay (#C55A2C)
- **Destructive** (e.g. Admin "Suspend", "Log out" confirm): background var(--error), color #fff
- **Disabled**: background var(--line-2), no hover, cursor default
- Chips/segmented toggles (role pickers, tab selectors): active = var(--ink) bg + white text; inactive = transparent bg + 1.5px var(--line-2) border

## Cards
Standard card: var(--white) background, 1px solid var(--line) border, 12–20px border-radius, 14–28px padding depending on density. KPI/stat cards use var(--paper) background nested inside a white panel for a two-tone effect.

## Tables
Header row: 13px var(--stone) weight 500, bottom border 1px var(--line). Body rows: 14px, border-bottom 1px var(--line) between rows, no zebra striping. Numeric columns right-aligned or centered depending on content type, in JetBrains Mono.

## Forms / Inputs
- Text/email/tel/password inputs: 1.5px solid var(--line-2) border, 10px radius, 12–14px padding, 15px font
- Focus: 2px solid var(--green) outline, 1px offset (defined globally, not per-input)
- Labels: 13px weight 600, 6px margin-bottom
- OTP inputs: 6 separate 44×52px boxes, JetBrains Mono 20px weight 600, auto-advance focus on input, backspace-to-previous

## Dropdowns / Selects
Same visual treatment as text inputs; role-switcher and filter dropdowns in Admin Portal use a bordered pill button that opens a bordered white panel list, 1px var(--line) border, 8–10px radius.

## Icons
Inline SVG only, simple geometric line icons (stroke-based, 1.7–2px stroke-width, no fills except small dots/checkmarks). No icon font, no emoji (per brand voice). Sizes: 14–16px in dense nav/table contexts, 18–26px in card headers, 30–44px in empty/success states.

## Navigation
- **Marketing**: sticky top nav, blurred translucent background, logo + 4 links + Login + "Book a Demo" CTA
- **Dashboards**: persistent left sidebar (collapsible), dark var(--ink) or var(--green-deep) background, icon + label nav items, active item = subtle tinted background + white text, inactive = #9AA39D text; user avatar/initials pinned at sidebar bottom

## Badges
Small pill, 99px radius, 11–12px JetBrains Mono text, colored per status (success/warning/error using the soft-tint formula above) — used for payment status, ticket status, verification status, occupancy status.

## Modals
Centered overlay, dark scrim backdrop, white panel 20–22px radius, 1px border optional, max-width 420–560px depending on content (forms narrower, detail panels wider). Close via explicit "Cancel"/"X" or backdrop click. No slide-in animation beyond a simple fade/scale-in.

## Alerts / Banners
Inline, not floating: 10px radius, 1px border + soft-tint background matching semantic color (error/warning/success), icon + text, 12–14px padding.

## Toast Notifications
Fixed bottom-center, var(--ink) background, white text, full pill radius, checkmark icon, slide-up entrance animation (`toastUp` keyframe, .3s ease-out), auto-dismiss after ~3s.

## Empty States
Dashed 1.5px var(--line-2) border container, centered icon (26px, var(--line-2) stroke) + one line of var(--stone) copy. Used for "no caretakers invited yet", "no tickets", etc.

## Loading States
Top-of-panel thin progress bar (3px, var(--clay) fill) using a `barSweep` keyframe (0.7s ease-out) during simulated async transitions (auth screen changes). Dashboards use inline spinners or disabled-button states for simulated save actions.

## Animations
| Name | Effect | Duration/Easing |
|---|---|---|
| barSweep | Loading bar width 0->100% | 0.7s ease-out |
| popIn | Success checkmark scale-in with overshoot | 0.5s ease-out |
| toastUp | Toast slides up + fades in | 0.3s ease-out |
| spin | Spinner rotation | linear, continuous |
| confetti (landlord/caretaker "finish" screens, task completion) | CSS-driven particle burst | ~1.5–2s, ease-out |

## Responsive Breakpoints
See `06-responsive-rules.md` for full behavior. Marketing pages use fluid clamp()/minmax() sizing rather than fixed breakpoints. Dashboards were designed primarily for desktop (≥1280px); tablet/mobile adaptation is a recommended follow-up (see Known Simplifications in README).
