import { Module } from "@nestjs/common";
import { TenantsController } from "./tenants.controller";
import { TenantsService } from "./tenants.service";
import { AccessModule } from "../../common/services/access.module";
import { InvitationsModule } from "../invitations/invitations.module";

@Module({
  imports: [AccessModule, InvitationsModule],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
