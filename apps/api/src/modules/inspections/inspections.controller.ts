import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { UserRole } from "@makazi/shared-types";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { InspectionsService } from "./inspections.service";
import { CreateInspectionDto } from "./dto/create-inspection.dto";
import { QueryInspectionsDto } from "./dto/query-inspections.dto";
import { PresignInspectionPhotoDto } from "./dto/presign-inspection-photo.dto";

// Caretaker/Landlord: move-in/routine inspections (move-out inspections are
// handled inline by the Move-Out Wizard — see UnitsService).
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.LANDLORD, UserRole.CARETAKER)
@Controller("inspections")
export class InspectionsController {
  constructor(private readonly inspectionsService: InspectionsService) {}

  @Post("presign")
  presignPhoto(@CurrentUser() user: AuthenticatedUser, @Body() dto: PresignInspectionPhotoDto) {
    return this.inspectionsService.presignPhoto(user, dto.unitId, dto.contentType);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateInspectionDto) {
    return this.inspectionsService.create(user, dto);
  }

  @Get()
  findMany(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryInspectionsDto) {
    return this.inspectionsService.findMany(user, query);
  }
}
