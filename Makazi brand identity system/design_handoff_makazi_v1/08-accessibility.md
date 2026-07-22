# 08 — Accessibility

The prototype was built for visual/interaction fidelity, not a full accessibility audit — treat this as a starting checklist for the real build, not a guarantee of current compliance.

## Keyboard Navigation
- All interactive elements (buttons, links, inputs) must be reachable via Tab in visual reading order; the prototype uses semantic `<button>`/`<a>`/`<input>` elements throughout, which gives correct default tab behavior — preserve this in the rebuild (don't switch to `<div onClick>` for interactive elements).
- OTP input groups: Tab moves between boxes; typing a digit auto-advances focus to the next box; Backspace on an empty box moves focus to the previous box. Preserve this exact behavior.
- Kanban drag-and-drop must have a keyboard-accessible equivalent (e.g. a "Move to…" menu on each card) — the prototype's drag-only interaction is a gap to close in production.
- Modals must trap focus while open and return focus to the triggering element on close.

## Color Contrast
- Primary text (--ink #0B140F) on --paper (#F6F5F0) and --white (#FFFFFF): passes AA/AAA easily (near-black on near-white).
- White text on --green (#0E5C43) and --green-deep (#093C2C): passes AA for normal text.
- var(--stone) (#5C665F) secondary text on --white/--paper: passes AA for normal text; verify AA for any smaller mono labels under 14px.
- Status badge text-on-tint combinations (success/warning/error) use the deep/saturated token as text color on a very light tint background — verify each combination against AA when finalizing exact tint opacities in code.
- Do not rely on color alone for status (payment/ticket/occupancy states) — the prototype pairs every status color with a text label; preserve that pairing.

## Focus Indicators
- A visible focus outline (2px, --green) is applied to all form inputs — extend this same treatment to buttons, links, and card-as-button elements in the rebuild, since the prototype currently only defines it for inputs.

## ARIA Labels
- Icon-only buttons (sidebar collapse toggle, modal close "X", search icon) need explicit `aria-label`s in production — the prototype uses bare SVGs with no text alternative.
- Status badges and progress indicators should expose their state via `aria-label` or visually-hidden text, not solely via color/shape.
- Modals need `role="dialog"`, `aria-modal="true"`, and an `aria-labelledby` pointing at the modal's heading.

## Screen Reader Considerations
- The OTP box pattern should be announced clearly (e.g. "Verification code, digit 1 of 6") — implement with appropriate `aria-label`s per box.
- Toast notifications should be in an `aria-live="polite"` region so screen readers announce them without interrupting.
- The AI Assistant chat log should be in an `aria-live="polite"` region for new assistant messages.

## Touch Targets
- All buttons/inputs in the prototype use ≥40px effective height (12–15px vertical padding + font-size), consistent with a 44px minimum touch target once border/margin is accounted for — verify each control hits 44×44px minimum when implementing the mobile breakpoint, especially icon-only buttons and Kanban card drag handles.
