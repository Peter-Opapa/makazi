import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { AdminPermission, UserRole } from "@makazi/shared-types";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { AdminPermissionGuard } from "../common/admin-permission.guard";
import { RequireAdminPermission } from "../common/admin-permission.decorator";
import { AdminMaintenanceService } from "./admin-maintenance.service";
import { ReassignTechnicianAdminDto } from "./dto/reassign-technician-admin.dto";

@UseGuards(JwtAuthGuard, RolesGuard, AdminPermissionGuard)
@Roles(UserRole.ADMIN)
@Controller("admin/maintenance")
export class AdminMaintenanceController {
  constructor(private readonly maintenanceService: AdminMaintenanceService) {}

  @Get()
  list() {
    return this.maintenanceService.list();
  }

  @Get("status-counts")
  statusCounts() {
    return this.maintenanceService.statusCounts();
  }

  @Get(":id")
  getDetail(@Param("id") id: string) {
    return this.maintenanceService.getDetail(id);
  }

  @RequireAdminPermission(AdminPermission.MANAGE_MAINTENANCE)
  @Patch(":id/reassign")
  reassign(@CurrentUser() actor: AuthenticatedUser, @Param("id") id: string, @Body() dto: ReassignTechnicianAdminDto) {
    return this.maintenanceService.reassignTechnician(actor.id, id, dto.technicianId);
  }

  @RequireAdminPermission(AdminPermission.MANAGE_MAINTENANCE)
  @Patch(":id/escalate")
  escalate(@CurrentUser() actor: AuthenticatedUser, @Param("id") id: string) {
    return this.maintenanceService.escalate(actor.id, id);
  }
}
