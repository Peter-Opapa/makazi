import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { PropertiesService } from "./properties.service";

// Landlord: own properties. Admin: platform-wide oversight.
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("properties")
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}
}
