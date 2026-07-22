# 07 — Interaction Specification

General patterns applied consistently across every screen; call out per-screen exceptions to your team as you build.

## Hover
- Primary buttons: bg darkens to the "-deep"/"-hover" token (e.g. --green -> --green-deep, --clay -> #C55A2C)
- Secondary/outline buttons: border darkens to --ink
- Links: color shifts --green -> --green-deep
- Cards (clickable, e.g. property/tenant cards): no shadow-lift by default in the prototype — recommend adding a subtle 1px border-color darken or 2–4px translateY lift for production polish, kept consistent across all clickable cards

## Focus
- All text/email/tel/password/search inputs: 2px solid var(--green) outline, 1px offset (global rule, do not override per-field)
- Buttons/links: rely on default browser focus ring at minimum; recommend a visible custom focus ring matching the input treatment for keyboard users (see 08-accessibility.md)

## Loading
- Screen-level async transition (auth flow navigation): top 3px progress bar sweeps 0->100% over 700ms, form area dims to 45% opacity + pointer-events disabled during the wait
- Button-level save actions (dashboard forms/settings): swap label to a short "Saving…" state or show an inline spinner; disable the button for the duration
- Payment processing (Tenant Pay Rent): dedicated "Processing…" modal state with a spinner before resolving to Success/Failure/Pending

## Success
- Checkmark icon in a soft-green circle, `popIn` scale animation (0.5s ease-out) — used for: password reset, registration/onboarding "finish" screens, payment success, task completion
- Confetti burst on Landlord/Caretaker onboarding "Finish" screens and on completing all of a caretaker's daily tasks
- Toast (bottom-center, dark pill, checkmark) for lightweight confirmations that don't warrant a full success screen (e.g. logout)

## Error
- Inline banner directly above the relevant form field(s): soft-red tint background, red border, warning-circle icon, red text — never a blocking modal or native alert()
- Specific demoed error states: wrong login password, password-mismatch on Create/Reset Password, invalid Tenant Code
- Failed payment: dedicated modal state (red icon, "Payment failed" + reason + "Try again" button) rather than an inline banner, since it interrupts an active multi-step process

## Disabled
- Background var(--line-2), original text color kept but visually muted by the flat gray background, no hover effect, cursor: default
- Applied to: "Continue" buttons before a required selection is made (e.g. Choose Role), form submits mid-loading

## Animations & Transitions
See `03-design-system.md` → Animations table for the full keyframe list (barSweep, popIn, toastUp, spin, confetti). All transitions are short (150–700ms) and ease-out — the product should feel snappy, not showy; avoid adding longer/bouncier motion than what's specified.

## Drag Interactions
- Maintenance Kanban (Caretaker + Landlord + Admin): cards are draggable between the 4 status columns; dropping a card updates its status immediately (no confirmation step) and appends an entry to Recent Activity / Audit Log where applicable
- Image Slot: drag-and-drop file onto the placeholder; click also opens a file browser as a fallback

## Per-Module Notes
- **Admin Portal**: every mutating action (suspend, reactivate, verify, reset password, retry payment callback, assign support agent, escalate, resolve, reassign maintenance) writes an entry to the Audit Log — this must be preserved in the real implementation as an actual audit trail, not just a UI log.
- **AI Assistant**: input accepts free text but only the 4 documented suggested prompts have real canned responses in the prototype; production should route free text to a real backend/LLM query over live data.
