import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { UnitsService } from "./units.service";

// Landlord/Caretaker: units on their properties.
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("units")
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}
}
