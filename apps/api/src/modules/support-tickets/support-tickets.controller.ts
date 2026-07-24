import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AdminPermission, UserRole } from "@makazi/shared-types";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { AdminPermissionGuard } from "../admin/common/admin-permission.guard";
import { RequireAdminPermission } from "../admin/common/admin-permission.decorator";
import { SupportTicketsService } from "./support-tickets.service";
import { CreateSupportTicketDto } from "./dto/create-support-ticket.dto";
import { AssignSupportTicketDto } from "./dto/assign-support-ticket.dto";
import { UpdateTicketNotesDto } from "./dto/update-ticket-notes.dto";

// POST is open to any authenticated role (a generic "contact support"); everything
// else is Admin Portal triage, gated additionally by RolesGuard + AdminPermissionGuard.
@UseGuards(JwtAuthGuard)
@Controller("support-tickets")
export class SupportTicketsController {
  constructor(private readonly ticketsService: SupportTicketsService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSupportTicketDto) {
    return this.ticketsService.create(user.id, dto.subject, dto.message);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  list() {
    return this.ticketsService.list();
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get("status-counts")
  statusCounts() {
    return this.ticketsService.statusCounts();
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get(":id")
  getDetail(@Param("id") id: string) {
    return this.ticketsService.getDetail(id);
  }

  @UseGuards(RolesGuard, AdminPermissionGuard)
  @Roles(UserRole.ADMIN)
  @RequireAdminPermission(AdminPermission.MANAGE_SUPPORT)
  @Patch(":id/assign")
  assign(@CurrentUser() actor: AuthenticatedUser, @Param("id") id: string, @Body() dto: AssignSupportTicketDto) {
    return this.ticketsService.assignAgent(actor.id, id, dto.agentId);
  }

  @UseGuards(RolesGuard, AdminPermissionGuard)
  @Roles(UserRole.ADMIN)
  @RequireAdminPermission(AdminPermission.MANAGE_SUPPORT)
  @Patch(":id/notes")
  updateNotes(@CurrentUser() actor: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateTicketNotesDto) {
    return this.ticketsService.updateNotes(actor.id, id, dto.notes);
  }

  @UseGuards(RolesGuard, AdminPermissionGuard)
  @Roles(UserRole.ADMIN)
  @RequireAdminPermission(AdminPermission.MANAGE_SUPPORT)
  @Patch(":id/escalate")
  escalate(@CurrentUser() actor: AuthenticatedUser, @Param("id") id: string) {
    return this.ticketsService.escalate(actor.id, id);
  }

  @UseGuards(RolesGuard, AdminPermissionGuard)
  @Roles(UserRole.ADMIN)
  @RequireAdminPermission(AdminPermission.MANAGE_SUPPORT)
  @Patch(":id/resolve")
  resolve(@CurrentUser() actor: AuthenticatedUser, @Param("id") id: string) {
    return this.ticketsService.resolve(actor.id, id);
  }
}
