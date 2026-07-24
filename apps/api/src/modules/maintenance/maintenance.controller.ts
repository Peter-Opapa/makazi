import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { UserRole } from "@makazi/shared-types";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { MaintenanceService } from "./maintenance.service";
import { CreateMaintenanceTicketDto } from "./dto/create-maintenance-ticket.dto";
import { UpdateMaintenanceStatusDto } from "./dto/update-maintenance-status.dto";
import { QueryMaintenanceDto } from "./dto/query-maintenance.dto";
import { PresignMaintenancePhotoDto } from "./dto/presign-maintenance-photo.dto";
import { AssignTechnicianDto } from "./dto/assign-technician.dto";
import { CreateCommentDto } from "./dto/create-comment.dto";

// Tenant: file + view their own tickets. Caretaker/Landlord: view + manage
// (Kanban status transitions) tickets on properties they have access to.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.LANDLORD, UserRole.CARETAKER, UserRole.TENANT)
@Controller("maintenance")
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post("presign")
  presignPhoto(@CurrentUser() user: AuthenticatedUser, @Body() dto: PresignMaintenancePhotoDto) {
    return this.maintenanceService.presignPhoto(user, dto.unitId, dto.contentType);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateMaintenanceTicketDto) {
    return this.maintenanceService.create(user, dto);
  }

  @Get()
  findMany(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryMaintenanceDto) {
    return this.maintenanceService.findMany(user, query);
  }

  @Get(":id")
  findOne(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.maintenanceService.findOne(user, id);
  }

  @Roles(UserRole.LANDLORD, UserRole.CARETAKER)
  @Patch(":id/status")
  updateStatus(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateMaintenanceStatusDto) {
    return this.maintenanceService.updateStatus(user, id, dto);
  }

  @Roles(UserRole.LANDLORD, UserRole.CARETAKER)
  @Post(":id/technician")
  assignTechnician(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: AssignTechnicianDto) {
    return this.maintenanceService.assignTechnician(user, id, dto);
  }

  @Post(":id/comments")
  addComment(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: CreateCommentDto) {
    return this.maintenanceService.addComment(user, id, dto);
  }

  @Get(":id/activities")
  listActivities(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.maintenanceService.listActivities(user, id);
  }
}
