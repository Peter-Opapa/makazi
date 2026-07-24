import { Module } from "@nestjs/common";
import { CaretakersController } from "./caretakers.controller";
import { CaretakersService } from "./caretakers.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { InvitationsModule } from "../invitations/invitations.module";

@Module({
  imports: [NotificationsModule, InvitationsModule],
  controllers: [CaretakersController],
  providers: [CaretakersService],
  exports: [CaretakersService],
})
export class CaretakersModule {}
