import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AdminPermission, UserRole } from "@makazi/shared-types";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { AdminPermissionGuard } from "../common/admin-permission.guard";
import { RequireAdminPermission } from "../common/admin-permission.decorator";
import { AdminRolesService } from "./admin-roles.service";
import { CreateStaffDto } from "./dto/create-staff.dto";
import { UpdateSubRoleDto } from "./dto/update-subrole.dto";

@UseGuards(JwtAuthGuard, RolesGuard, AdminPermissionGuard)
@Roles(UserRole.ADMIN)
@Controller("admin/roles")
export class AdminRolesController {
  constructor(private readonly rolesService: AdminRolesService) {}

  @Get("staff")
  listStaff() {
    return this.rolesService.listStaff();
  }

  @RequireAdminPermission(AdminPermission.MANAGE_ROLES)
  @Post("staff")
  createStaff(@CurrentUser() actor: AuthenticatedUser, @Body() dto: CreateStaffDto) {
    return this.rolesService.createStaff(actor.id, dto);
  }

  @RequireAdminPermission(AdminPermission.MANAGE_ROLES)
  @Patch("staff/:id/subrole")
  updateSubRole(@CurrentUser() actor: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateSubRoleDto) {
    return this.rolesService.updateSubRole(actor.id, id, dto.subRole);
  }
}
