import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { UserRole } from "@makazi/shared-types";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { AdminPropertiesService } from "./admin-properties.service";

// Platform-wide oversight only — read-only for every admin subrole, no mutating actions (design prototype has none for Properties).
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller("admin/properties")
export class AdminPropertiesController {
  constructor(private readonly propertiesService: AdminPropertiesService) {}

  @Get()
  list(@Query("county") county?: string, @Query("search") search?: string) {
    return this.propertiesService.list(county, search);
  }

  @Get(":id")
  getDetail(@Param("id") id: string) {
    return this.propertiesService.getDetail(id);
  }
}
