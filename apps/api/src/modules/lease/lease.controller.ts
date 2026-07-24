import { Controller, Get, UseGuards } from "@nestjs/common";
import { UserRole } from "@makazi/shared-types";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { LeaseService } from "./lease.service";

// Tenant self-service only — a tenant's own current lease and its document.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TENANT)
@Controller("lease")
export class LeaseController {
  constructor(private readonly leaseService: LeaseService) {}

  @Get()
  getCurrentLease(@CurrentUser() user: AuthenticatedUser) {
    return this.leaseService.getCurrentLease(user.id);
  }

  @Get("document")
  getLeaseDocument(@CurrentUser() user: AuthenticatedUser) {
    return this.leaseService.getLeaseDocument(user.id);
  }
}
