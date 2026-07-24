import { Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { AdminPermission, UserRole } from "@makazi/shared-types";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { AdminPermissionGuard } from "../common/admin-permission.guard";
import { RequireAdminPermission } from "../common/admin-permission.decorator";
import { AdminUsersService } from "./admin-users.service";

@UseGuards(JwtAuthGuard, RolesGuard, AdminPermissionGuard)
@Roles(UserRole.ADMIN)
@Controller("admin/users")
export class AdminUsersController {
  constructor(private readonly usersService: AdminUsersService) {}

  @Get()
  list(@Query("role") role?: UserRole, @Query("search") search?: string) {
    return this.usersService.list(role, search);
  }

  @Get(":id")
  getDetail(@Param("id") id: string) {
    return this.usersService.getDetail(id);
  }

  @RequireAdminPermission(AdminPermission.MANAGE_USERS)
  @Patch(":id/suspend")
  suspend(@CurrentUser() actor: AuthenticatedUser, @Param("id") id: string) {
    return this.usersService.setSuspended(actor.id, id, true);
  }

  @RequireAdminPermission(AdminPermission.MANAGE_USERS)
  @Patch(":id/reactivate")
  reactivate(@CurrentUser() actor: AuthenticatedUser, @Param("id") id: string) {
    return this.usersService.setSuspended(actor.id, id, false);
  }

  @RequireAdminPermission(AdminPermission.MANAGE_USERS)
  @Patch(":id/verify")
  verify(@CurrentUser() actor: AuthenticatedUser, @Param("id") id: string) {
    return this.usersService.verifyIdentity(actor.id, id);
  }

  @RequireAdminPermission(AdminPermission.MANAGE_USERS)
  @Post(":id/reset-password")
  resetPassword(@CurrentUser() actor: AuthenticatedUser, @Param("id") id: string) {
    return this.usersService.resetPassword(actor.id, id);
  }
}
