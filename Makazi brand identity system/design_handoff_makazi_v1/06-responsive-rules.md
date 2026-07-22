# 06 — Responsive Rules

## Marketing Website
Built fluidly with `clamp()` and CSS grid `auto-fit/minmax()` rather than fixed breakpoints — content reflows continuously from mobile to desktop widths. No dedicated mobile nav (hamburger) was designed; the nav link row should collapse to a hamburger menu below ~640px in production (flag: not yet designed, standard pattern expected).

## Dashboards (Landlord / Caretaker / Tenant / Admin)
Primary target: **desktop, ≥1280px.** Recommended breakpoint behavior for production (not fully designed in the prototype — apply standard SaaS dashboard conventions consistent with the token system above):

**Desktop (≥1280px)**
- Sidebar: full width (230px), expanded by default, collapse toggle available
- KPI cards: 3–4 column grid
- Tables: full column set visible
- Modals: centered, fixed max-width

**Tablet (768–1279px)**
- Sidebar: auto-collapses to icon-only (~72px), expandable via toggle/overlay
- KPI cards: 2-column grid
- Tables: horizontally scrollable within their card, or collapse secondary columns
- Modals: same centered pattern, width scales down proportionally

**Mobile (<768px)**
- Sidebar: becomes a bottom tab bar or a slide-over drawer triggered by a hamburger/menu icon (matches the mobile tab-bar pattern already used in the marketing site's Tenant app phone mockup — reuse that visual language)
- KPI cards: single column, stacked
- Tables: convert to stacked card rows (one card per record) rather than a scrolling table
- Modals: full-screen sheets instead of centered dialogs
- Kanban board (Maintenance): becomes a single-column list with a status filter/tab switcher instead of 4 side-by-side columns

## Forms
At all sizes, form fields stay full-width within their container; multi-column form rows (e.g. First name / Last name) stack to a single column below ~600px.

## Sidebars
Collapse behavior should persist per-user (localStorage/user pref) once implemented — the prototype's collapse toggle is session-only.

## Dialogs / Modals
Centered modal pattern holds down to tablet width; below ~480px, convert to full-screen takeover sheets with a persistent header and close button, per standard mobile UX conventions.
