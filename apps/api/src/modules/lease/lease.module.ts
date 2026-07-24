import { Module } from "@nestjs/common";
import { LeaseController } from "./lease.controller";
import { LeaseService } from "./lease.service";

// StorageGateway comes from the global IntegrationsModule (see src/integrations).
@Module({
  controllers: [LeaseController],
  providers: [LeaseService],
})
export class LeaseModule {}
