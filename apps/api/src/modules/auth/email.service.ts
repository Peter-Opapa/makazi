import { Inject, Injectable } from "@nestjs/common";
import { EMAIL_GATEWAY, type EmailGateway } from "../../integrations/email/email-gateway.types";

const APP_NAME = "Makazi";

/**
 * Auth-specific email formatter — composes the Admin/staff password-reset
 * code message, then sends through the same swappable EmailGateway every
 * other module's email goes through (see IntegrationsModule). Real delivery
 * is enabled by setting SMTP_HOST/USER/PASSWORD/FROM; unset, it falls back
 * to a gateway that just logs, same as the rest of the app.
 */
@Injectable()
export class EmailService {
  constructor(@Inject(EMAIL_GATEWAY) private readonly gateway: EmailGateway) {}

  async sendPasswordResetCode(email: string, code: string) {
    await this.gateway.sendEmail(
      email,
      `${APP_NAME}: password reset code`,
      `Your password reset code is ${code}. It expires in 15 minutes. If you didn't request this, you can ignore this email.`,
    );
  }
}
