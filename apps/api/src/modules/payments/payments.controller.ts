import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { PaymentsService } from "./payments.service";

// Tenant: pay rent. Landlord: ledger. Admin: reconciliation.
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}
}
