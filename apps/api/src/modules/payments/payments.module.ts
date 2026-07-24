import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PaymentsController } from "./payments.controller";
import { PaymentWebhooksController } from "./payment-webhooks.controller";
import { PaymentsService } from "./payments.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { AccessModule } from "../../common/services/access.module";
import { PAYMENT_GATEWAY } from "./gateway/payment-gateway.types";
import { DarajaGatewayService } from "./gateway/daraja-gateway.service";
import { DarajaSimulatorService } from "./gateway/daraja-simulator.service";

// StorageGateway comes from the global IntegrationsModule (see src/integrations).
@Module({
  imports: [NotificationsModule, AccessModule],
  controllers: [PaymentsController, PaymentWebhooksController],
  providers: [
    PaymentsService,
    DarajaGatewayService,
    DarajaSimulatorService,
    {
      provide: PAYMENT_GATEWAY,
      useFactory: (config: ConfigService, real: DarajaGatewayService, simulator: DarajaSimulatorService) =>
        config.get<string>("DARAJA_CONSUMER_KEY") ? real : simulator,
      inject: [ConfigService, DarajaGatewayService, DarajaSimulatorService],
    },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
