# 01 — Screen Inventory

Every approved screen, grouped by module. "Entry Point" = how a user typically arrives; "Exit Actions" = what a primary action on the screen leads to.

---

## Module 1: Marketing Website

| Screen | Purpose | Role | Entry Point | Exit Actions | Related Screens |
|---|---|---|---|---|---|
| Home | Brand intro, mission, live tabbed dashboard preview (Landlord/Caretaker/Tenant), FAQ | Visitor | Direct URL / ads / search | "Book a Demo" -> Contact; "Log in" -> Auth (Login); nav to Features/Pricing/About/Contact | Features, Pricing, About, Contact, Auth |
| Features | Role-by-role feature breakdown (Landlord/Caretaker/Tenant) + future financial-services teaser | Visitor | Nav from any marketing page | "Book a Demo" -> Contact | Home, Pricing, Contact |
| Pricing | 3-tier pricing (Starter/Growth/Enterprise) with monthly/annual toggle, comparison table, FAQ | Visitor | Nav from any marketing page | "Book a Demo" -> Contact | Home, Features, Contact |
| About | Origin story, mission/vision, why-Kenya-first, philosophy, 3-phase roadmap | Visitor | Nav from any marketing page | "Book a Demo" -> Contact | Home, Contact |
| Contact | Book-a-demo form, founder contact card, contact FAQ | Visitor | Nav / any "Book a Demo" CTA | Form submit -> inline confirmation state | Home, About, Pricing, Features |

## Module 2: Authentication & Onboarding
File: `Makazi App - Auth.dc.html` (single state-machine component, ~29 screens)

| Screen | Purpose | Role | Entry Point | Exit Actions | Related Screens |
|---|---|---|---|---|---|
| Login | Email/password login + role chip (Landlord/Caretaker/Tenant) to pick which dashboard to preview | Any | Marketing "Log in", direct link, Session Expired, Logout Confirm | Success -> Login Success; "Forgot password?" -> Forgot Email; "Create an account" -> Register | Register, Forgot Email, Login Success |
| Register | Name / email / phone capture | Prospective user | Login "Create an account" | Continue -> Choose Role | Choose Role |
| Choose Role | Select Landlord / Caretaker / Tenant (locked after) | New user | After Register | Continue -> Verify Email | Verify Email |
| Verify Email | 6-digit OTP to email, resend w/ 30s countdown | New user | After Choose Role | Verify -> Verify Phone | Verify Phone |
| Verify Phone | 6-digit OTP to phone, resend w/ 30s countdown | New user | After Verify Email | Verify -> Create Password (or Tenant Code if tenant) | Create Password |
| Create Password | Set + confirm password, strength meter | New user | After Verify Phone | Success -> Welcome | Welcome |
| Forgot Email | Enter email to request reset code | Existing user | Login "Forgot password?" | Send -> Forgot OTP | Forgot OTP |
| Forgot OTP | 6-digit reset code entry | Existing user | After Forgot Email | Verify -> Reset Password | Reset Password |
| Reset Password | Set new password + confirm | Existing user | After Forgot OTP | Success -> Reset Success | Reset Success |
| Reset Success | Confirmation | Existing user | After Reset Password | "Back to log in" -> Login | Login |
| Login Success | "Redirecting to your {role} dashboard" confirmation | Any | Successful Login | Continue -> real role dashboard file | Landlord/Caretaker/Tenant Dashboard |
| Welcome | Personalized welcome + role-specific subcopy | New user | After Create Password | "Get started" -> first onboarding screen for chosen role | Landlord/Caretaker/Tenant onboarding |
| Landlord: Company (1/7) | Business name + type | Landlord | After Welcome | Continue -> Portfolio | Portfolio |
| Landlord: Portfolio (2/7) | # properties, # units | Landlord | After Company | Continue -> Payment | Payment |
| Landlord: Payment (3/7) | PayBill / Till / Bank details | Landlord | After Portfolio | Continue -> Logo | Logo |
| Landlord: Logo (4/7) | Optional logo upload (image-slot) | Landlord | After Payment | Continue/Skip -> Invite | Invite |
| Landlord: Invite (5/7) | Invite caretaker by email/phone; empty -> populated list state | Landlord | After Logo | Continue/Skip -> Property | Property |
| Landlord: Property (6/7) | First property name/location/units | Landlord | After Invite | Continue -> Finish | Finish |
| Landlord: Finish (7/7) | Summary + confetti | Landlord | After Property | "Go to dashboard" -> Landlord Dashboard | Landlord Dashboard |
| Caretaker: Accept Invite (1/4) | Recap of landlord's invite, Accept/Decline | Caretaker | After Welcome | Accept -> Profile | Profile |
| Caretaker: Profile (2/4) | Photo, phone, ID, emergency contact, language | Caretaker | After Accept | Continue -> Caretaker Welcome | Caretaker Welcome |
| Caretaker: Welcome (3/4) | Shows assigned properties | Caretaker | After Profile | Continue -> Permissions | Permissions |
| Caretaker: Permissions (4/4) | Can/cannot-do list | Caretaker | After Welcome | "Go to dashboard" -> Caretaker Dashboard | Caretaker Dashboard |
| Tenant: Invite (1/3) | Tenant code entry, invalid-code error demo | Tenant | After Welcome | Verify -> Terms | Terms |
| Tenant: Terms (2/3) | Unit/lease confirmation | Tenant | After Invite | Confirm -> Tenant Welcome | Tenant Welcome |
| Tenant: Welcome (3/3) | Final confirmation | Tenant | After Terms | "View dashboard" -> Tenant Dashboard | Tenant Dashboard |
| Dashboard Placeholder | Fallback "Phase 2" note (legacy; login/onboarding now route to real dashboards) | Any | Manual prototype-nav jump only | Links back to Home / Logout | Home |
| Session Expired | Security timeout message | Any | Manual prototype-nav jump (simulated) | "Log in again" -> Login | Login |
| Logout Confirm | Confirm logout | Any | "Log out" from a dashboard | Confirm -> Login (+ toast); Cancel -> back | Login |

_All 29 screens are also reachable instantly via the collapsible "Prototype Nav" panel (bottom-right) for QA/review._

## Module 3: Landlord Experience
File: `Makazi App - Landlord Dashboard.dc.html` — persistent sidebar shell, 8 sections

| Section | Purpose | Entry Point | Key Modals/Exit Actions |
|---|---|---|---|
| Overview | Revenue, collection, occupancy KPIs; cash flow chart; AI insights; recent activity; onboarding checklist | Login success / sidebar | Quick Actions -> jumps to other sections |
| Properties | Grid/list of properties, add property | Sidebar | Add Property modal; click-through to property detail |
| Tenants | Tenant directory + full profile modal (lease, balance, docs, comms, rental passport) | Sidebar | Tenant Profile modal; Move-out workflow |
| Payments | Rent ledger, pending/late payments, receipts | Sidebar | Payment Details modal; Export Report |
| Maintenance | Kanban-style ticket board | Sidebar | Assign Technician; Mark Completed; Close Ticket |
| Caretakers | Caretaker roster, invite, performance | Sidebar | Invite Caretaker modal |
| Reports | Monthly revenue/occupancy/collections/vacancy reports | Sidebar | Download PDF/Excel (stubbed) |
| Settings | Profile, business, payment, notifications, security, team | Sidebar | Save confirmations per tab |

## Module 4: Caretaker Experience
File: `Makazi App - Caretaker Dashboard.dc.html` — 8 sections, operations-only (no financial/business settings)

| Section | Purpose | Entry Point | Key Modals/Exit Actions |
|---|---|---|---|
| Overview | Today's checkable tasks (w/ confetti), KPIs, recent tenant requests, quick actions | Login success / sidebar | Task complete toggles |
| Properties | Assigned property cards (occupied/vacant/repairs) | Sidebar | Property detail |
| Tenants | Directory + profile modal, register tenant, edit, move-out | Sidebar | Register Tenant modal; Move-Out wizard |
| Units | Building view grouped by floor (occupied/vacant/reserved/under-maintenance) | Sidebar | Unit detail / transfer tenant |
| Maintenance | True drag-and-click Kanban: Reported -> Assigned -> In Progress -> Completed | Sidebar | Assign Technician modal |
| Inspections | Checklist modal with photo slots (move-in/move-out/routine) | Sidebar | Submit Inspection |
| Calendar | Light monthly calendar of tasks/inspections | Sidebar | — |
| Settings | Profile only (no payment/business config, by design) | Sidebar | Save confirmation |

Embedded AI Assistant with suggested prompts available throughout.

## Module 5: Tenant Experience
File: `Makazi App - Tenant Dashboard.dc.html` — 8 sections, desktop web-app shell

| Section | Purpose | Entry Point | Key Modals/Exit Actions |
|---|---|---|---|
| Overview | Rent due card, quick pay, recent activity | Login success / sidebar | "Pay Rent" -> Pay modal |
| Pay Rent | STK Push / USSD / WhatsApp payment simulation | Sidebar or Overview CTA | Success/Failure/Pending modal states -> Receipt |
| Receipts | Payment history + downloadable receipts | Sidebar | Receipt detail modal |
| Lease | Lease terms, renewal date, deposit | Sidebar | — |
| Maintenance | Report an issue (photo), ticket status | Sidebar | New Ticket modal |
| Rental Passport | Rental history + alternative credit score preview | Sidebar | — |
| Contact Caretaker | Caretaker contact card, message | Sidebar | — |
| Settings | Profile, notifications, security | Sidebar | Save confirmation |

## Module 6: Admin Portal
File: `Makazi App - Admin Portal.dc.html` — internal staff tool, 13 sections + auth gate

| Section | Purpose | Entry Point | Key Modals/Exit Actions |
|---|---|---|---|
| Staff Login | Email/password -> MFA OTP -> suspicious-login banner | Direct URL (internal only) | -> Dashboard |
| Dashboard | Platform-wide KPIs, system alerts | After login | — |
| Users | Search/filter Landlords/Caretakers/Tenants/Admins; profile modal (suspend/reactivate/verify/reset password) | Sidebar | Actions logged to Audit Log |
| Properties | Platform-wide property oversight | Sidebar | — |
| Payments | Status tabs (Successful/Failed/Pending/Reconciliation); retry callback | Sidebar | Actions logged to Audit Log |
| Support | Ticket queue; assign agent, notes, escalate, resolve | Sidebar | Actions logged to Audit Log |
| Maintenance | Cross-platform ticket oversight; reassign, escalate | Sidebar | Actions logged to Audit Log |
| Technicians | Technician marketplace roster | Sidebar | — |
| Notifications | System-wide notification broadcast/log | Sidebar | — |
| Finance | Subscription/billing oversight | Sidebar | — |
| System Health | Uptime/error monitoring | Sidebar | — |
| AI Ops | AI assistant usage/monitoring | Sidebar | — |
| Audit Log | Full log of all admin actions taken across the portal | Sidebar | — |
| Settings | Role/permission matrix, admin profile | Sidebar | — |

Role-switcher dropdown simulates Super Admin / Ops / Support / Finance / Tech / Analyst views.

## Module 7: Shared Components
No standalone file — see `04-component-library.md`. Patterns (sidebar shell, KPI card, modal, kanban card, status badge, etc.) are re-implemented consistently inline across the 3 dashboards + Admin Portal.

## Module 8: Design System
`Makazi Brand Identity.dc.html` documents brand rationale (logo concepts, color psychology, typography reasoning, brand voice) — see `03-design-system.md` for the extracted, implementation-ready version.
