# 02 — User Flows

Every approved end-to-end journey, with the exact screen-to-screen path.

## Flow 1: Visitor -> Landlord Onboarding -> Dashboard
Home (marketing) -> "Book a Demo" or "Log in" -> Auth: Register -> Choose Role (Landlord) -> Verify Email (OTP) -> Verify Phone (OTP) -> Create Password -> Welcome -> Landlord onboarding: Company -> Portfolio -> Payment Method -> Logo (optional) -> Invite Caretaker (optional) -> First Property -> Finish -> **Landlord Dashboard** (Overview)

## Flow 2: Landlord -> Add Property -> Add Caretaker -> Add Tenant
Landlord Dashboard (Overview) -> Properties -> "Add Property" modal -> save -> Caretakers -> "Invite Caretaker" modal -> send invite -> Tenants -> (tenant self-registers via Tenant Code flow, see Flow 5) or landlord views tenant once caretaker registers them (Flow 4)

## Flow 3: Caretaker -> Register Tenant -> Assign Unit
Caretaker Dashboard (Overview or Tenants) -> "Register Tenant" modal (name, phone, ID) -> Units -> select vacant unit -> "Assign Tenant" -> unit status flips to Occupied -> tenant appears in Tenants directory

## Flow 4: Tenant -> Login -> Pay Rent -> Receipt
Auth: Login (role = Tenant) -> Login Success -> **Tenant Dashboard** (Overview, rent-due card) -> "Pay Rent" -> Pay Rent screen -> choose channel (STK Push / USSD / WhatsApp) -> Processing state -> Success modal -> Receipts (new entry appears) -> download/view receipt

## Flow 5: Tenant Self-Onboarding (Tenant Code)
Auth: Register -> Choose Role (Tenant) -> Verify Email -> Verify Phone -> Tenant: Invite (enter Tenant Code from caretaker/landlord; invalid code shows inline error) -> Tenant: Terms (confirm unit/lease) -> Tenant: Welcome -> **Tenant Dashboard**

## Flow 6: Caretaker Onboarding (Invited by Landlord)
Auth: Register -> Choose Role (Caretaker) -> Verify Email -> Verify Phone -> Welcome -> Caretaker: Accept Invite (recap of which landlord/property invited them) -> Verify/Profile -> Caretaker: Welcome (assigned properties shown) -> Permissions (can/cannot list) -> **Caretaker Dashboard**

## Flow 7: Landlord Receives Maintenance Request -> Resolution
Tenant Dashboard: Maintenance -> "Report an issue" (photo + description) -> ticket created
  -> Landlord Dashboard: Maintenance (Kanban, new card in "Reported") -> "Assign Technician" modal -> card moves to "Assigned" -> (simulated) -> "In Progress" -> "Mark Completed" -> "Close Ticket" -> ticket archived, tenant sees "Resolved" status in their Maintenance list

Caretaker equivalent: Caretaker Dashboard: Maintenance Kanban (same 4-column flow), reachable directly by caretaker without landlord involvement for caretaker-assigned properties.

## Flow 8: Forgot Password
Auth: Login -> "Forgot password?" -> Forgot Email -> Forgot OTP -> Reset Password -> Reset Success -> back to Login

## Flow 9: Session Expiry / Logout
Any dashboard -> (session timeout, simulated) -> Session Expired screen -> "Log in again" -> Login
Any dashboard -> sidebar "Log out" -> Logout Confirm -> "Log out" -> toast "You've been logged out" -> Login

## Flow 10: Admin -> Login -> Search User -> Suspend Account
Admin Portal: Staff Login (email/password) -> MFA OTP -> Dashboard -> Users -> search/filter by role -> open user profile modal -> "Suspend" -> confirmation -> user status flips to Suspended -> action recorded in Audit Log

## Flow 11: Admin -> Payment Investigation
Admin Portal: Dashboard -> Payments -> filter "Failed" -> open payment detail -> "Retry Callback" -> status updates -> logged to Audit Log

## Flow 12: Admin -> Support Ticket Resolution
Admin Portal: Support -> open ticket -> "Assign Agent" -> add notes -> "Escalate" (optional) -> "Resolve" -> logged to Audit Log

## Flow 13: Landlord Move-Out
Landlord/Caretaker Dashboard: Tenants -> tenant profile -> "Move Out" -> 6-step wizard (Confirm -> Inspect -> Damage Assessment -> Deposit Reconciliation -> Move-Out Report -> Unit marked Vacant) -> unit reappears as Vacant in Units view
