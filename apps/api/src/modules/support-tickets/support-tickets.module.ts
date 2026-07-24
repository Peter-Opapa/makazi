import { Module } from "@nestjs/common";
import { SupportTicketsController } from "./support-tickets.controller";
import { SupportTicketsService } from "./support-tickets.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { AuditLogModule } from "../audit-log/audit-log.module";

@Module({
  imports: [NotificationsModule, AuditLogModule],
  controllers: [SupportTicketsController],
  providers: [SupportTicketsService],
  exports: [SupportTicketsService],
})
export class SupportTicketsModule {}
