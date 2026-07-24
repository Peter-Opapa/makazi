import { Module } from "@nestjs/common";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";
import { AccessModule } from "../../common/services/access.module";

// StorageGateway comes from the global IntegrationsModule (see src/integrations).
@Module({
  imports: [AccessModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
