import { Module } from "@nestjs/common";
import { InvitationEmailService } from "./invitation-email.service";

// EmailGateway comes from the global IntegrationsModule (see src/integrations).
@Module({
  providers: [InvitationEmailService],
  exports: [InvitationEmailService],
})
export class InvitationsModule {}
