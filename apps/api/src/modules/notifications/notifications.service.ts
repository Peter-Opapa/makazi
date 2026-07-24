import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { NOTIFICATION_TYPE_CATEGORY, NotificationCategory, NotificationType } from "@makazi/shared-types";
import { Prisma } from "../../../generated/prisma";
import { PrismaService } from "../../prisma/prisma.service";
import { SMS_GATEWAY, type SmsGateway } from "../../integrations/sms/sms-gateway.types";
import { EMAIL_GATEWAY, type EmailGateway } from "../../integrations/email/email-gateway.types";
import { WHATSAPP_GATEWAY, type WhatsAppGateway } from "../../integrations/whatsapp/whatsapp-gateway.types";
import { UpdateNotificationPreferencesDto } from "./dto/update-notification-preferences.dto";

interface PreferenceRow {
  paymentsSms: boolean;
  paymentsEmail: boolean;
  paymentsWhatsapp: boolean;
  maintenanceSms: boolean;
  maintenanceEmail: boolean;
  maintenanceWhatsapp: boolean;
  accountSms: boolean;
  accountEmail: boolean;
  accountWhatsapp: boolean;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(SMS_GATEWAY) private readonly sms: SmsGateway,
    @Inject(EMAIL_GATEWAY) private readonly email: EmailGateway,
    @Inject(WHATSAPP_GATEWAY) private readonly whatsapp: WhatsAppGateway,
  ) {}

  /**
   * Called by other modules (Maintenance, Caretakers, Payments, ...) when
   * something notification-worthy happens. The in-app row is written
   * synchronously — callers can rely on it existing once this resolves.
   * SMS/Email/WhatsApp fan-out happens in the background per the user's
   * preferences, and never blocks or fails the caller's own action.
   */
  async create(userId: string, type: NotificationType, title: string, body?: string, metadata?: Prisma.InputJsonValue) {
    const notification = await this.prisma.notification.create({ data: { userId, type, title, body, metadata } });
    this.dispatch(userId, type, title, body).catch((err) =>
      this.logger.error(`Fan-out failed for notification ${notification.id}: ${err}`),
    );
    return notification;
  }

  listForUser(userId: string, unreadOnly: boolean) {
    return this.prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { readAt: null } : {}) },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  unreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, readAt: null } });
  }

  async markRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({ where: { id, userId } });
    if (!notification) throw new NotFoundException("Notification not found");
    return this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
    return { message: "All notifications marked as read" };
  }

  getPreferences(userId: string) {
    return this.getOrCreatePreferences(userId);
  }

  async updatePreferences(userId: string, dto: UpdateNotificationPreferencesDto) {
    await this.getOrCreatePreferences(userId);
    return this.prisma.notificationPreference.update({ where: { userId }, data: dto });
  }

  private async dispatch(userId: string, type: NotificationType, title: string, body?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const prefs = await this.getOrCreatePreferences(userId);
    const { sms, email, whatsapp } = this.channelsFor(NOTIFICATION_TYPE_CATEGORY[type], prefs);
    const message = body ? `${title} — ${body}` : title;

    const tasks: Promise<void>[] = [];
    if (sms && user.phone) tasks.push(this.sms.sendSms(user.phone, message));
    if (email && user.email) tasks.push(this.email.sendEmail(user.email, title, message));
    if (whatsapp && user.phone) tasks.push(this.whatsapp.sendTemplateMessage(user.phone, "generic_notification", [title, body ?? ""]));

    const results = await Promise.allSettled(tasks);
    for (const result of results) {
      if (result.status === "rejected") this.logger.warn(`Notification channel send failed: ${result.reason}`);
    }
  }

  private channelsFor(category: NotificationCategory, prefs: PreferenceRow): { sms: boolean; email: boolean; whatsapp: boolean } {
    switch (category) {
      case NotificationCategory.PAYMENTS:
        return { sms: prefs.paymentsSms, email: prefs.paymentsEmail, whatsapp: prefs.paymentsWhatsapp };
      case NotificationCategory.MAINTENANCE:
        return { sms: prefs.maintenanceSms, email: prefs.maintenanceEmail, whatsapp: prefs.maintenanceWhatsapp };
      case NotificationCategory.ACCOUNT:
        return { sms: prefs.accountSms, email: prefs.accountEmail, whatsapp: prefs.accountWhatsapp };
    }
  }

  private async getOrCreatePreferences(userId: string) {
    const existing = await this.prisma.notificationPreference.findUnique({ where: { userId } });
    if (existing) return existing;
    return this.prisma.notificationPreference.create({ data: { userId } });
  }
}
