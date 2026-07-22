import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { MaintenanceService } from "./maintenance.service";

// Tenant: file tickets. Caretaker/Landlord: Kanban. Admin: cross-platform oversight.
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("maintenance")
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}
}
