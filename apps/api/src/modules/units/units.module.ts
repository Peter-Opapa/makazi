import { Module } from "@nestjs/common";
import { UnitsController } from "./units.controller";
import { UnitsService } from "./units.service";
import { AccessModule } from "../../common/services/access.module";
import { InvitationsModule } from "../invitations/invitations.module";
import { NotificationsModule } from "../notifications/notifications.module";

// StorageGateway comes from the global IntegrationsModule (see src/integrations).
@Module({
  imports: [AccessModule, InvitationsModule, NotificationsModule],
  controllers: [UnitsController],
  providers: [UnitsService],
  exports: [UnitsService],
})
export class UnitsModule {}

