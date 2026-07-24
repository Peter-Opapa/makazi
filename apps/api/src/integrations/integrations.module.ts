import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SMS_GATEWAY } from "./sms/sms-gateway.types";
import { AfricasTalkingSmsService } from "./sms/africastalking-sms.service";
import { SmsSimulatorService } from "./sms/sms-simulator.service";
import { EMAIL_GATEWAY } from "./email/email-gateway.types";
import { SmtpEmailService } from "./email/smtp-email.service";
import { EmailSimulatorService } from "./email/email-simulator.service";
import { WHATSAPP_GATEWAY } from "./whatsapp/whatsapp-gateway.types";
import { WhatsAppCloudService } from "./whatsapp/whatsapp-cloud.service";
import { WhatsAppSimulatorService } from "./whatsapp/whatsapp-simulator.service";
import { STORAGE_GATEWAY } from "./storage/storage-gateway.types";
import { S3StorageService } from "./storage/s3-storage.service";
import { MAPS_GATEWAY } from "./maps/maps-gateway.types";
import { GoogleMapsService } from "./maps/google-maps.service";
import { MapsSimulatorService } from "./maps/maps-simulator.service";

/**
 * Every external service integration Makazi has (Daraja is the one
 * exception — it's payment-domain-specific and stays in PaymentsModule's
 * own gateway/ folder). Each gateway is picked real-vs-simulator by whether
 * its credentials are configured, never by NODE_ENV — see each provider's
 * useFactory. @Global() so any module can `@Inject(X_GATEWAY)` without
 * importing this module explicitly, since these are cross-cutting
 * infrastructure (Email in particular is used by both AuthModule and
 * NotificationsModule, which don't otherwise depend on each other).
 */
@Global()
@Module({
  providers: [
    AfricasTalkingSmsService,
    SmsSimulatorService,
    SmtpEmailService,
    EmailSimulatorService,
    WhatsAppCloudService,
    WhatsAppSimulatorService,
    S3StorageService,
    GoogleMapsService,
    MapsSimulatorService,
    {
      provide: SMS_GATEWAY,
      useFactory: (real: AfricasTalkingSmsService, sim: SmsSimulatorService, config: ConfigService) =>
        config.get<string>("AFRICASTALKING_API_KEY") ? real : sim,
      inject: [AfricasTalkingSmsService, SmsSimulatorService, ConfigService],
    },
    {
      provide: EMAIL_GATEWAY,
      useFactory: (real: SmtpEmailService, sim: EmailSimulatorService, config: ConfigService) =>
        config.get<string>("SMTP_HOST") ? real : sim,
      inject: [SmtpEmailService, EmailSimulatorService, ConfigService],
    },
    {
      provide: WHATSAPP_GATEWAY,
      useFactory: (real: WhatsAppCloudService, sim: WhatsAppSimulatorService, config: ConfigService) =>
        config.get<string>("WHATSAPP_ACCESS_TOKEN") ? real : sim,
      inject: [WhatsAppCloudService, WhatsAppSimulatorService, ConfigService],
    },
    {
      provide: STORAGE_GATEWAY,
      useExisting: S3StorageService,
    },
    {
      provide: MAPS_GATEWAY,
      useFactory: (real: GoogleMapsService, sim: MapsSimulatorService, config: ConfigService) =>
        config.get<string>("GOOGLE_MAPS_API_KEY") ? real : sim,
      inject: [GoogleMapsService, MapsSimulatorService, ConfigService],
    },
  ],
  exports: [SMS_GATEWAY, EMAIL_GATEWAY, WHATSAPP_GATEWAY, STORAGE_GATEWAY, MAPS_GATEWAY],
})
export class IntegrationsModule {}
