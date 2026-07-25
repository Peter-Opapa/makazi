import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { UserRole } from "@makazi/shared-types";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { TenantsService } from "./tenants.service";
import { RequestExitDto } from "./dto/request-exit.dto";

/** A tenant's own tenancies — accepting an invite from a new landlord, or asking to leave a unit. */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TENANT)
@Controller("my/tenancies")
export class MyTenanciesController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.tenantsService.listMyTenancies(user.id);
  }

  @Post(":id/accept")
  accept(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.tenantsService.acceptTenancy(user.id, id);
  }

  @Post(":id/decline")
  decline(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.tenantsService.declineTenancy(user.id, id);
  }

  @Post(":id/request-exit")
  requestExit(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: RequestExitDto) {
    return this.tenantsService.requestExit(user.id, id, dto);
  }
}
