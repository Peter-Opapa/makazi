import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { AdminPermission, UserRole } from "@makazi/shared-types";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { AdminPermissionGuard } from "../common/admin-permission.guard";
import { RequireAdminPermission } from "../common/admin-permission.decorator";
import { AdminSettingsService } from "./admin-settings.service";
import { UpdatePlatformSettingsDto } from "./dto/update-platform-settings.dto";

@UseGuards(JwtAuthGuard, RolesGuard, AdminPermissionGuard)
@Roles(UserRole.ADMIN)
@Controller("admin/settings")
export class AdminSettingsController {
  constructor(private readonly settingsService: AdminSettingsService) {}

  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  @RequireAdminPermission(AdminPermission.MANAGE_SETTINGS)
  @Patch()
  updateSettings(@CurrentUser() actor: AuthenticatedUser, @Body() dto: UpdatePlatformSettingsDto) {
    return this.settingsService.updateSettings(actor.id, dto);
  }
}
