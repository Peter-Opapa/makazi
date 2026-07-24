import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { UserRole } from "@makazi/shared-types";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { UnitsService } from "./units.service";
import { UpdateUnitDto } from "./dto/update-unit.dto";
import { AssignTenantDto } from "./dto/assign-tenant.dto";
import { MoveOutInspectDto } from "./dto/move-out-inspect.dto";
import { MoveOutDamageDto } from "./dto/move-out-damage.dto";
import { MoveOutDepositDto } from "./dto/move-out-deposit.dto";
import { PresignPhotoDto } from "../properties/dto/presign-photo.dto";

// Landlord/Caretaker: units on properties they have access to (see
// PropertyAccessService — ownership for landlords, accepted assignment for
// caretakers). Property-scoped routes (list/create/bulk-generate) live on
// PropertiesController — this controller only handles operations on a
// single, already-known unit.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.LANDLORD, UserRole.CARETAKER)
@Controller("units")
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Patch(":id")
  update(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateUnitDto) {
    return this.unitsService.update(user, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.unitsService.remove(user, id);
  }

  @Post(":id/assign-tenant")
  assignTenant(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: AssignTenantDto) {
    return this.unitsService.assignTenant(user, id, dto);
  }

  @Get(":id/move-out")
  getMoveOut(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.unitsService.getMoveOut(user, id);
  }

  @Post(":id/move-out/start")
  startMoveOut(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.unitsService.startMoveOut(user, id);
  }

  @Post(":id/move-out/confirm")
  confirmMoveOut(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.unitsService.confirmMoveOut(user, id);
  }

  @Post(":id/move-out/inspect/presign")
  presignInspectionPhoto(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: PresignPhotoDto) {
    return this.unitsService.presignInspectionPhoto(user, id, dto.contentType);
  }

  @Patch(":id/move-out/inspect")
  moveOutInspect(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: MoveOutInspectDto) {
    return this.unitsService.moveOutInspect(user, id, dto);
  }

  @Patch(":id/move-out/damage-assessment")
  moveOutDamageAssessment(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: MoveOutDamageDto,
  ) {
    return this.unitsService.moveOutDamageAssessment(user, id, dto);
  }

  @Patch(":id/move-out/deposit-reconciliation")
  moveOutDepositReconciliation(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: MoveOutDepositDto,
  ) {
    return this.unitsService.moveOutDepositReconciliation(user, id, dto);
  }

  @Post(":id/move-out/generate-report")
  moveOutGenerateReport(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.unitsService.moveOutGenerateReport(user, id);
  }

  @Post(":id/move-out/complete")
  completeMoveOut(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.unitsService.completeMoveOut(user, id);
  }
}
