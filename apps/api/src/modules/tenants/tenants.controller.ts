import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { UserRole } from "@makazi/shared-types";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { TenantsService } from "./tenants.service";
import { RegisterTenantDto } from "./dto/register-tenant.dto";

// Landlord/Caretaker: tenancy directory for properties they have access to.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.LANDLORD, UserRole.CARETAKER)
@Controller("tenants")
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  register(@CurrentUser() user: AuthenticatedUser, @Body() dto: RegisterTenantDto) {
    return this.tenantsService.registerTenant(user.id, dto);
  }

  @Get()
  findMany(@CurrentUser() user: AuthenticatedUser, @Query("search") search?: string) {
    return this.tenantsService.findMany(user, search);
  }

  @Post(":id/resend-invite")
  resendInvite(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.tenantsService.resendInvite(user, id);
  }
}
