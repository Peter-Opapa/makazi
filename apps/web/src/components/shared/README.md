# Shared components

Cross-role UI patterns identified from the design handoff — not yet implemented. Build on top of `src/components/ui` (shadcn primitives).

- `Sidebar` — collapsible nav shell (Landlord/Caretaker/Tenant dashboards + Admin)
- `KpiTile` — stat card (label + big mono number + delta)
- `DataTable` — header row + rows, mono numeric columns
- `StatusBadge` — pill, colored per semantic status (success/warning/error)
- `Modal` — shared overlay shell, content swapped by a `kind` prop
- `OtpInputGroup` — 6-box OTP input, auto-advance/backspace
- `SegmentedToggle` / `Chip` — role picker, payment-method picker, billing toggle
- `Accordion` — FAQ (wraps `ui/accordion`)
- `EmptyState` — dashed border + icon + one line of copy
- `ConfettiBurst` — onboarding/task-completion celebration
- `AiAssistantPanel` — floating chat widget (Landlord/Caretaker/Tenant)
- `KanbanBoard` / `KanbanCard` — Maintenance ticket board (native HTML5 DnD)

See `../../../../Makazi brand identity system/design_handoff_makazi_v1/04-component-library.md` for the full catalogue and `03-design-system.md` for visual spec.
