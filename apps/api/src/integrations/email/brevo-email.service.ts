import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { EmailGateway } from "./email-gateway.types";

/**
 * Real email delivery via Brevo's HTTPS API — used instead of
 * SmtpEmailService on hosts (Railway included) that block outbound SMTP
 * ports (25/465/587) entirely at the network level, which no SMTP
 * credentials can work around. Requires BREVO_API_KEY; reuses the same
 * SMTP_FROM value SmtpEmailService uses ("Name <email>") rather than
 * introducing a separate sender config. See IntegrationsModule's
 * EMAIL_GATEWAY provider for the real-vs-real-vs-simulator selection.
 */
@Injectable()
export class BrevoEmailService implements EmailGateway {
  private readonly logger = new Logger(BrevoEmailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    const sender = this.parseSender();
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": this.config.getOrThrow<string>("BREVO_API_KEY"),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender,
        to: [{ email: to }],
        subject,
        textContent: body,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      this.logger.error(`Brevo send failed: ${res.status} ${errBody}`);
      throw new Error("Failed to send email");
    }
  }

  private parseSender(): { name: string; email: string } {
    const raw = this.config.getOrThrow<string>("SMTP_FROM");
    const match = raw.match(/^(.*?)\s*<(.+)>$/);
    return match ? { name: match[1].trim(), email: match[2].trim() } : { name: "Makazi", email: raw.trim() };
  }
}
