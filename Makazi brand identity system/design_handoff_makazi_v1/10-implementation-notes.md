# 10 — Implementation Notes

Per-module notes on expected behavior, validation, conditional states, and permissions. Use alongside the .dc.html files for exact copy/layout.

## Authentication
**Purpose**: Single auth flow serving all 4 roles (Landlord, Caretaker, Tenant designed; Admin is a separate portal). Role is chosen once at registration and is not user-editable afterward in this design.
**Validation rules**:
- Email: standard email format
- Password: minimum 8 characters (strength meter shows 3 bars based on length/complexity heuristics — recreate with a real zxcvbn-style or rule-based strength check)
- Password confirmation: must exactly match
- OTP: 6 numeric digits; prototype accepts any 6 digits as "correct" except where a specific wrong-value demo is scripted (login password "wrong", tenant code must equal a fixed demo code)
- Tenant Code: format like "MKZ-XXXXX"; production should validate against real caretaker/landlord-issued codes with an expiry
**Conditional states**: Payment-method fields on Landlord onboarding conditionally show PayBill vs Till vs Bank inputs based on the selected chip. Resend-OTP link is disabled for a 30s countdown after each send.
**Permissions**: None yet (pre-auth). Role selection determines which onboarding branch and which dashboard the user lands in post-auth.

## Landlord Dashboard
**Purpose**: Command center for landlords managing 1–500+ units — collections, occupancy, tenants, caretakers, maintenance, reports.
**Expected behavior**: Overview aggregates data across all of a landlord's properties; Property Selector (if the landlord has multiple properties) should scope Overview/Payments/Maintenance to a single property when selected.
**Validation**: Add Property requires name + location at minimum; unit counts should be non-negative integers.
**Conditional states**: Onboarding checklist on Overview only shows for accounts with incomplete setup (dismissible). Empty states for zero properties/tenants/caretakers before first data is added.
**Permissions**: Landlord role has full read/write over their own properties, tenants, caretakers, payments, and reports. Cannot see other landlords' data (single-tenant data model per landlord account).

## Caretaker Dashboard
**Purpose**: Operational tool for day-to-day property management — no financial/business configuration (explicitly excluded by design, per user instruction during design phase).
**Expected behavior**: Caretaker only sees properties/units/tenants assigned to them by a landlord, not a platform-wide view.
**Validation**: Register Tenant requires name + phone at minimum; Unit assignment requires selecting a vacant unit.
**Conditional states**: Units view groups by floor and colors by status (Occupied/Vacant/Reserved/Under Maintenance) — status changes propagate immediately to the Landlord's view of the same property.
**Permissions**: Read/write on assigned properties' tenants, units, inspections, and maintenance tickets. No access to payment settings, business settings, or properties they aren't assigned to.

## Tenant Dashboard
**Purpose**: Self-service portal for a single tenant's unit — pay rent, view history, report issues, build rental history.
**Expected behavior**: Pay Rent must support 3 channels (STK Push/M-Pesa, USSD, WhatsApp) — production must integrate real payment gateways for each; Makazi never custodies funds, so the destination account is always the landlord's own PayBill/Till/Bank as configured during Landlord onboarding.
**Validation**: Maintenance ticket requires a description; photo attachment optional but encouraged.
**Conditional states**: Rent-due card changes tone (default -> warning -> error) as the due date approaches/passes, matching the --warning/--error tokens. Payment flow has explicit Success / Failure / Pending outcome states — Pending should poll for a real async payment confirmation in production (STK Push callbacks are not instant).
**Permissions**: Tenant can only see and act on their own unit/lease/payments — no visibility into other tenants or landlord-level data.

## Admin Portal
**Purpose**: Internal Makazi staff tool for platform oversight, support, and compliance — not customer-facing.
**Expected behavior**: Every mutating action must be permanently recorded in the Audit Log with actor, action, target, and timestamp — this is a compliance requirement, not just a UI nicety.
**Validation**: Suspend/Reactivate require a reason (prototype may not enforce this — add in production for audit quality).
**Conditional states**: Suspicious-login banner shown post-MFA on first login of a session (simulated); role-switcher changes which sections/actions are available per the permission matrix documented in Settings.
**Permissions**: Role-gated — Super Admin has full access; Ops/Support/Finance/Tech/Analyst roles should each be restricted to their relevant sections and mutating actions per the matrix in Admin Settings. Enforce this server-side, not just by hiding UI.

## Marketing Website
**Purpose**: Public-facing acquisition site — no auth required, no user data.
**Expected behavior**: Contact form should submit to a real CRM/lead pipeline in production; the prototype shows only a client-side inline success state.
**Validation**: Standard required-field validation on the Book-a-Demo form (name, email; phone/units/message optional).
**Permissions**: Fully public, no role restrictions.
