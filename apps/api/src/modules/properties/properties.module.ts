import { Module } from "@nestjs/common";
import { PropertiesController } from "./properties.controller";
import { PropertiesService } from "./properties.service";
import { UnitsModule } from "../units/units.module";
import { AccessModule } from "../../common/services/access.module";

// StorageGateway/MapsGateway come from the global IntegrationsModule (see src/integrations).
@Module({
  imports: [UnitsModule, AccessModule],
  controllers: [PropertiesController],
  providers: [PropertiesService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
