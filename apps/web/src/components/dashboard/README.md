# Dashboard-only components

Per-role screen bodies compose from `../shared` primitives. Put role-specific pieces here, e.g.:

- Landlord: `MoveOutWizard` (net-new — not in the original prototype, needs product design), `CashFlowChart`, `OnboardingChecklist`
- Caretaker: `UnitsFloorView`, `InspectionChecklist`
- Tenant: `RentDueCard`, `PaymentChannelPicker`, `RentalPassportScore`
- Admin: `AuditLogTable`, `PermissionMatrix`, `RoleSwitcher`
