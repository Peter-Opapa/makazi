import { Module } from "@nestjs/common";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";

// SMS/Email/WhatsApp gateway tokens come from the global IntegrationsModule
// (see src/integrations) — no need to import it explicitly here.
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
