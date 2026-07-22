# 09 — Screen Connection Map

## Top-Level Module Graph
```
Marketing Website (Home, Features, Pricing, About, Contact)
   |
   |-- "Log in" / "Book a Demo" --> Authentication
                                        |
                    +-------------------+-------------------+
                    |                   |                   |
              Choose Role: Landlord  Caretaker            Tenant
                    |                   |                   |
              Landlord Onboarding  Caretaker Onboarding  Tenant Onboarding
                    |                   |                   |
              Landlord Dashboard   Caretaker Dashboard   Tenant Dashboard

Admin Portal is a separate, isolated entry point (internal staff URL) —
not linked from the marketing site or the 3 role dashboards.
```

## Authentication Internal Map
```
Login --> Login Success --> [role]Dashboard
Login --> Forgot Email --> Forgot OTP --> Reset Password --> Reset Success --> Login
Login --> Register --> Choose Role --> Verify Email --> Verify Phone --> Create Password --> Welcome
Welcome --(role=landlord)--> Company -> Portfolio -> Payment -> Logo -> Invite -> Property -> Finish --> Landlord Dashboard
Welcome --(role=caretaker)--> Accept Invite -> Profile -> Caretaker Welcome -> Permissions --> Caretaker Dashboard
Welcome --(role=tenant)--> Tenant Invite (code) -> Tenant Terms -> Tenant Welcome --> Tenant Dashboard
[any dashboard] --Log out--> Logout Confirm --> Login
[any dashboard] --(session timeout)--> Session Expired --> Login
```

## Landlord Dashboard Internal Map
```
Overview <--> Properties <--> Tenants <--> Payments <--> Maintenance <--> Caretakers <--> Reports <--> Settings
(all 8 sections reachable directly from the persistent sidebar; Overview's Quick Actions deep-link into Properties/Tenants/Payments/Maintenance)
Tenants --> Tenant Profile modal --> Move-Out Wizard (6 steps) --> back to Tenants (unit now Vacant)
Maintenance --> ticket card --> Assign Technician modal --> card moves columns
```

## Caretaker Dashboard Internal Map
```
Overview <--> Properties <--> Tenants <--> Units <--> Maintenance <--> Inspections <--> Calendar <--> Settings
Tenants --> Register Tenant modal / Tenant Profile modal --> Move-Out Wizard
Units --> vacant unit --> Assign Tenant action --> unit becomes Occupied, tenant appears in Tenants
Maintenance --> Kanban card --> Assign Technician modal
Inspections --> Inspection modal (checklist + photo slots) --> Submit --> logged
```

## Tenant Dashboard Internal Map
```
Overview --> Pay Rent --> (STK Push | USSD | WhatsApp) --> Processing --> Success/Failure/Pending --> Receipts
Overview <--> Receipts <--> Lease <--> Maintenance <--> Rental Passport <--> Contact Caretaker <--> Settings
Maintenance --> New Ticket modal --> ticket appears in list --> (status updated externally by Landlord/Caretaker Maintenance Kanban)
```

## Admin Portal Internal Map
```
Staff Login --> MFA --> Dashboard
Dashboard <--> Users <--> Properties <--> Payments <--> Support <--> Maintenance <--> Technicians <--> Notifications <--> Finance <--> System Health <--> AI Ops <--> Audit Log <--> Settings
Users --> user profile modal --> Suspend/Reactivate/Verify/Reset Password --> Audit Log entry
Payments --> payment detail --> Retry Callback --> Audit Log entry
Support --> ticket --> Assign Agent / Escalate / Resolve --> Audit Log entry
Maintenance --> ticket --> Reassign / Escalate --> Audit Log entry
```

## Cross-Module Data Dependencies (for backend/API planning)
- A maintenance ticket created on the **Tenant** dashboard must appear on the corresponding **Caretaker** and **Landlord** Maintenance Kanbans (and in the **Admin** Maintenance oversight view).
- A tenant registered by a **Caretaker** must appear in the **Landlord**'s Tenants directory and the **Admin** Users list.
- A caretaker invited by a **Landlord** must receive the **Caretaker onboarding** invite (Accept Invite screen shows the inviting landlord's name and property).
- A payment made on the **Tenant** dashboard must appear in the **Landlord**'s Payments/Rent Ledger and the **Admin**'s Payments view.
- Every mutating admin action must append to the single, shared **Audit Log**.
