# 04 — Component Library

Reusable UI patterns found across the Makazi app, implemented inline/consistently in every file (no shared code file in the prototype — each dashboard re-implements the same visual pattern). Recreate each as a real shared component in the target codebase.

## Navigation
- **Marketing Navbar**: sticky, blurred bg, logo, link row, Login link, CTA button
- **Dashboard Sidebar**: collapsible, dark bg, icon+label nav buttons, active/inactive states, user chip at bottom, "Log out" entry
- **Onboarding Stepper**: horizontal row of numbered/checked circles connected by thin lines, 3 states (upcoming/active/done), shown at top of onboarding screens only

## Buttons
- **Primary Button** — solid green, white text, 10px radius
- **Secondary/Outline Button** — bordered, transparent bg
- **Accent CTA Button** — clay/orange, for marketing conversions
- **Destructive Button** — red, for suspend/delete/logout-confirm
- **Icon Button** — small square/circle, icon only (sidebar collapse toggle, modal close)
- **Segmented Toggle / Chip Group** — 2–3 option pill toggle (monthly/annual, role picker, payment method picker)

## Cards
- **KPI/Stat Card** — label (mono, uppercase, small) + big number (mono, bold) + delta/context line
- **Property Card** — image/placeholder + name + address + occupancy stat row
- **Tenant Card / Row** — avatar-initials + name + unit + status badge
- **Payment Card / Row** — payer + amount (mono) + status badge + date
- **Maintenance/Kanban Card** — title, unit, reporter, priority tag, assignee avatar
- **Dashboard Preview Mockup Card** (marketing only) — scaled-down replica of the real dashboard shell for the "See it in action" section

## Data Display
- **Data Table** — header row + bordered body rows, mono numeric columns
- **Chart (bar)** — simple CSS flex-based bar chart (height-percentage divs), no charting library — recreate with a real charting lib (e.g. Recharts) matching the color usage (green-line default bars, green for recent/highlighted, clay for the latest/peak bar)
- **Status Badge** — pill, colored per semantic status
- **Progress Bar** — thin bar, used for loading and for onboarding/step completion contexts

## Forms
- **Text/Email/Tel/Password Input** — labeled, bordered, 10px radius
- **OTP Input Group** — 6 auto-advancing boxes
- **Search Bar** — icon + input, used in Admin Portal and Tenant/Caretaker directories
- **Dropdown/Filter Select** — bordered pill trigger + panel list
- **Image Slot** — drag-and-drop image placeholder (logo upload, profile photo, inspection photos) — in production, back this with a real file upload + storage flow

## Feedback & Overlays
- **Modal** — centered panel + scrim, used for Add Property, Invite Caretaker, Tenant Profile, Assign Technician, Payment Detail, etc.
- **Confirmation Dialog** — smaller modal variant, 2-button (Cancel/Confirm), used for Logout, Suspend User, Close Ticket
- **Drawer** — not used; all detail views in this prototype are centered modals, not slide-in drawers (flag to team if drawers are preferred for large detail views in production)
- **Toast** — bottom-center transient confirmation
- **Empty State** — dashed border + icon + one line of copy
- **Inline Alert/Banner** — error/warning/success soft-tint box with icon

## AI Assistant
- **Chat Panel** — slide-in or docked panel, message bubbles (user right-aligned green-tinted, assistant left-aligned white/bordered), suggested-prompt chip row above the input, canned responses to: "Who hasn't paid rent?", "Show vacant units", "How much revenue did I collect this month?", "Which caretaker has the most pending repairs?"

## Kanban Board (Maintenance)
- 4 fixed columns (Reported / Assigned / In Progress / Completed), drag-and-drop card movement between columns, click-to-open card detail modal for Assign Technician / Mark Completed / Close Ticket actions

## Wizards / Multi-step Flows
- **Move-Out Wizard** — 6-step linear flow (Confirm -> Inspect -> Damage Assessment -> Deposit Reconciliation -> Report -> Vacant) with a step indicator, back/continue navigation
- **Onboarding Flows** — Landlord (7 steps), Caretaker (4 steps), Tenant (3 steps), each using the Onboarding Stepper component

## Calendar
- Simple month-grid calendar (Caretaker Dashboard), day cells with small task/inspection indicator dots
