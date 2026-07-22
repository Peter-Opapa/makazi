import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { TenantsService } from "./tenants.service";

// Landlord/Caretaker: tenancy directory. Tenant: own tenancy.
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("tenants")
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}
}
