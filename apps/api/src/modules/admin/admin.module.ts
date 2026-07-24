import { Module } from "@nestjs/common";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { AuthModule } from "../auth/auth.module";
import { PaymentsModule } from "../payments/payments.module";
import { MaintenanceModule } from "../maintenance/maintenance.module";
import { AdminDashboardController } from "./dashboard/admin-dashboard.controller";
import { AdminDashboardService } from "./dashboard/admin-dashboard.service";
import { AdminUsersController } from "./users/admin-users.controller";
import { AdminUsersService } from "./users/admin-users.service";
import { AdminPropertiesController } from "./properties/admin-properties.controller";
import { AdminPropertiesService } from "./properties/admin-properties.service";
import { AdminPaymentsController } from "./payments/admin-payments.controller";
import { AdminPaymentsService } from "./payments/admin-payments.service";
import { AdminMaintenanceController } from "./maintenance/admin-maintenance.controller";
import { AdminMaintenanceService } from "./maintenance/admin-maintenance.service";
import { AdminAnalyticsController } from "./analytics/admin-analytics.controller";
import { AdminAnalyticsService } from "./analytics/admin-analytics.service";
import { AdminSettingsController } from "./settings/admin-settings.controller";
import { AdminSettingsService } from "./settings/admin-settings.service";
import { AdminRolesController } from "./roles/admin-roles.controller";
import { AdminRolesService } from "./roles/admin-roles.service";
import { AdminPermissionGuard } from "./common/admin-permission.guard";

@Module({
  imports: [AuditLogModule, AuthModule, PaymentsModule, MaintenanceModule],
  controllers: [
    AdminDashboardController,
    AdminUsersController,
    AdminPropertiesController,
    AdminPaymentsController,
    AdminMaintenanceController,
    AdminAnalyticsController,
    AdminSettingsController,
    AdminRolesController,
  ],
  providers: [
    AdminPermissionGuard,
    AdminDashboardService,
    AdminUsersService,
    AdminPropertiesService,
    AdminPaymentsService,
    AdminMaintenanceService,
    AdminAnalyticsService,
    AdminSettingsService,
    AdminRolesService,
  ],
})
export class AdminModule {}
