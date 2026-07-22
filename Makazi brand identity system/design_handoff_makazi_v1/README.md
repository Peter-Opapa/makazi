# Makazi — Design Handoff Package (Version 1.0)

## Overview
This package is the single source of truth for implementing Makazi, a Kenyan property-management SaaS platform, in a production codebase. It documents every approved screen across the marketing site, authentication, three role-based dashboards (Landlord, Caretaker, Tenant), and the internal Admin Portal.

**This is a design freeze.** Nothing in this package introduces new features or redesigns approved screens — it organizes, documents and standardizes what has already been approved for build.

## About the Design Files
The `.dc.html` files in `design-files/` are **interactive HTML design prototypes** — not production code. They were built to demonstrate exact look, copy, layout and click-through behavior using mock data (no backend, no real payments, no real auth). Open any file directly in a browser to click through it.

**Your task is to recreate these designs in the target codebase's real environment** (React, Vue, native mobile, or whatever stack the team has chosen) using that stack's own component patterns, state management and API layer — not to ship this HTML as-is. Treat every screen in these files as the pixel-accurate spec for what to build.

## Fidelity
**High-fidelity.** Every screen uses final colors, typography, spacing and copy. Recreate pixel-accurately. Where a value isn't explicit (e.g. an exact shadow blur), use the closest token from 05-design-tokens.md.

## How This Package Is Organized
1. README.md — this file
2. 01-screen-inventory.md — every screen: purpose, role, entry/exit points, related screens
3. 02-user-flows.md — the approved end-to-end journeys
4. 03-design-system.md — color, type, spacing, grid, radius, shadow, and component-pattern documentation
5. 04-component-library.md — reusable component catalogue with usage notes
6. 05-design-tokens.md — flat token list for direct use in code (CSS variables / theme file)
7. 06-responsive-rules.md — desktop/tablet/mobile behavior
8. 07-interaction-spec.md — hover/focus/loading/success/error/disabled states and animations
9. 08-accessibility.md — keyboard, contrast, ARIA, screen reader, touch target notes
10. 09-screen-connection-map.md — full navigation graph between every screen
11. 10-implementation-notes.md — validation rules, conditional states, and permissions per module
12. design-files/ — the 11 approved .dc.html prototype files, plus assets/ (logo marks) referenced by them

## Modules (Files -> Module Map)
| # | Module | File(s) |
|---|--------|---------|
| 1 | Marketing Website | Makazi Website - Home.dc.html, - Features.dc.html, - Pricing.dc.html, - About.dc.html, - Contact.dc.html |
| 2 | Authentication & Onboarding | Makazi App - Auth.dc.html |
| 3 | Landlord Experience | Makazi App - Landlord Dashboard.dc.html |
| 4 | Caretaker Experience | Makazi App - Caretaker Dashboard.dc.html |
| 5 | Tenant Experience | Makazi App - Tenant Dashboard.dc.html |
| 6 | Admin Portal | Makazi App - Admin Portal.dc.html |
| 7 | Shared Components | documented in 04-component-library.md - no separate file; each dashboard implements the same patterns inline |
| 8 | Design System | Makazi Brand Identity.dc.html (source of truth for brand rationale) + 05-design-tokens.md |

## Known Simplifications in the Prototype (flag these to your team)
- No real backend, auth, or payment integration - all data is realistic mock data (Kenyan names, KES amounts, Nairobi-area estates).
- STK Push / M-Pesa, USSD, and WhatsApp payment flows are simulated with fixed timers, not live gateways.
- AI Assistant responses are canned to a fixed set of prompts, not a live model call.
- Mobile breakpoints were designed conceptually (see 06-responsive-rules.md) but the dashboards were primarily built and tested at desktop width; a dedicated mobile pass is recommended before launch.

## Assets
- assets/makazi-mark.png - dark mark, for light backgrounds
- assets/makazi-mark-light.png - light mark, for dark/green backgrounds
- Photography/inspection photos throughout are drag-and-drop placeholder slots (<image-slot>), not final imagery - replace with real photography or user uploads.

## Questions
This README and its companion docs are meant to be self-sufficient. If anything is ambiguous, the .dc.html files are the final tie-breaker - open them and click through the exact interaction in question.
