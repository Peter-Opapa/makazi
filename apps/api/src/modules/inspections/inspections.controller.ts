import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { InspectionsService } from "./inspections.service";

// Caretaker: move-in/move-out/routine inspections.
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("inspections")
export class InspectionsController {
  constructor(private readonly inspectionsService: InspectionsService) {}
}
