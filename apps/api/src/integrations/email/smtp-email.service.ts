import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createTransport, type Transporter } from "nodemailer";
import type { EmailGateway } from "./email-gateway.types";

/**
 * Real email delivery via SMTP (works with any provider — SES, SendGrid,
 * Postmark, a plain mailbox — since they all speak SMTP). Shared by every
 * module that sends email — Auth's OTP/reset codes and Notifications'
 * fan-out both go through this same gateway now (see IntegrationsModule).
 */
@Injectable()
export class SmtpEmailService implements EmailGateway {
  private readonly logger = new Logger(SmtpEmailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    const transporter = this.getTransporter();
    await transporter.sendMail({
      from: this.config.getOrThrow<string>("SMTP_FROM"),
      to,
      subject,
      text: body,
    });
  }

  private getTransporter(): Transporter {
    if (this.transporter) return this.transporter;
    this.transporter = createTransport({
      host: this.config.getOrThrow<string>("SMTP_HOST"),
      port: this.config.get<number>("SMTP_PORT", 587),
      secure: this.config.get<string>("SMTP_SECURE") === "true",
      auth: {
        user: this.config.getOrThrow<string>("SMTP_USER"),
        pass: this.config.getOrThrow<string>("SMTP_PASSWORD"),
      },
    });
    return this.transporter;
  }
}
