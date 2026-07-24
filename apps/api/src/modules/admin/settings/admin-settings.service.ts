import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../../prisma/prisma.service";
import { AuditLogService } from "../../audit-log/audit-log.service";

const SINGLETON_ID = "singleton";

@Injectable()
export class AdminSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly auditLog: AuditLogService,
  ) {}

  async getSettings() {
    const settings = await this.prisma.platformSettings.upsert({
      where: { id: SINGLETON_ID },
      update: {},
      create: { id: SINGLETON_ID },
    });

    return {
      platformName: settings.platformName,
      supportEmail: settings.supportEmail,
      supportPhone: settings.supportPhone,
      updatedAt: settings.updatedAt,
      integrations: this.integrationStatus(),
    };
  }

  async updateSettings(actorId: string, dto: { platformName?: string; supportEmail?: string; supportPhone?: string }) {
    const updated = await this.prisma.platformSettings.upsert({
      where: { id: SINGLETON_ID },
      update: { ...dto, updatedById: actorId },
      create: { id: SINGLETON_ID, ...dto, updatedById: actorId },
    });

    await this.auditLog.record({
      actorId,
      action: "Updated platform settings",
      targetType: "PlatformSettings",
      targetId: SINGLETON_ID,
      metadata: dto,
    });

    return this.getSettings();
  }

  /**
   * Real, not decorative — mirrors exactly the env-var checks each gateway
   * module's DI factory uses to pick real-vs-simulator (PaymentsModule,
   * NotificationsModule), so this reflects actual system wiring rather than
   * a fake status page.
   */
  private integrationStatus() {
    return {
      daraja: !!this.config.get<string>("DARAJA_CONSUMER_KEY"),
      sms: !!this.config.get<string>("AFRICASTALKING_API_KEY"),
      email: !!this.config.get<string>("SMTP_HOST"),
      whatsapp: !!this.config.get<string>("WHATSAPP_ACCESS_TOKEN"),
    };
  }
}
