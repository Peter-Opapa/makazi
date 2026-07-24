import { Module } from "@nestjs/common";
import { MaintenanceController } from "./maintenance.controller";
import { MaintenanceService } from "./maintenance.service";
import { AccessModule } from "../../common/services/access.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { TechniciansModule } from "../technicians/technicians.module";

// StorageGateway comes from the global IntegrationsModule (see src/integrations).
@Module({
  imports: [AccessModule, NotificationsModule, TechniciansModule],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}
