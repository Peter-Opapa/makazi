import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { UserRole } from "@makazi/shared-types";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { TechniciansService } from "./technicians.service";
import { CreateTechnicianDto } from "./dto/create-technician.dto";
import { UpdateTechnicianDto } from "./dto/update-technician.dto";

// Landlord's own contractor roster — not a Makazi login. Caretakers assigned
// to that landlord's properties can see and use it too (see TechniciansService).
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.LANDLORD, UserRole.CARETAKER)
@Controller("technicians")
export class TechniciansController {
  constructor(private readonly techniciansService: TechniciansService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTechnicianDto) {
    return this.techniciansService.create(user, dto);
  }

  @Get()
  findMany(@CurrentUser() user: AuthenticatedUser) {
    return this.techniciansService.findMany(user);
  }

  @Patch(":id")
  update(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateTechnicianDto) {
    return this.techniciansService.update(user, id, dto);
  }
}
