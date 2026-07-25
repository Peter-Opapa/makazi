import { Module } from "@nestjs/common";
import { TenantsController } from "./tenants.controller";
import { MyTenanciesController } from "./my-tenancies.controller";
import { TenantsService } from "./tenants.service";
import { AccessModule } from "../../common/services/access.module";
import { InvitationsModule } from "../invitations/invitations.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [AccessModule, InvitationsModule, NotificationsModule],
  controllers: [TenantsController, MyTenanciesController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
