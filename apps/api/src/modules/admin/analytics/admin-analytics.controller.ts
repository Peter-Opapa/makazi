import { Controller, Get, ParseIntPipe, Query, UseGuards } from "@nestjs/common";
import { UserRole } from "@makazi/shared-types";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { AdminAnalyticsService } from "./admin-analytics.service";

// Read-only for every admin subrole.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller("admin/analytics")
export class AdminAnalyticsController {
  constructor(private readonly analyticsService: AdminAnalyticsService) {}

  @Get()
  getAnalytics(@Query("months", new ParseIntPipe({ optional: true })) months?: number) {
    return this.analyticsService.getAnalytics(months);
  }
}
