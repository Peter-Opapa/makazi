import { Module } from "@nestjs/common";
import { InspectionsController } from "./inspections.controller";
import { InspectionsService } from "./inspections.service";
import { AccessModule } from "../../common/services/access.module";

// StorageGateway comes from the global IntegrationsModule (see src/integrations).
@Module({
  imports: [AccessModule],
  controllers: [InspectionsController],
  providers: [InspectionsService],
  exports: [InspectionsService],
})
export class InspectionsModule {}
