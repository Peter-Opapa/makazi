import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EMAIL_GATEWAY, type EmailGateway } from "../../integrations/email/email-gateway.types";

const APP_NAME = "Makazi";

/**
 * Composes invitation emails for caretakers/tenants who are pre-created by
 * a landlord (see CaretakersService.invite / TenantsService.registerTenant)
 * and sends them through the same swappable EmailGateway every other
 * module's email goes through (see IntegrationsModule). Lives in its own
 * module rather than AuthModule so CaretakersModule/TenantsModule don't need
 * to pull in Auth's JWT/Clerk wiring just to send an email.
 */
@Injectable()
export class InvitationEmailService {
  constructor(
    @Inject(EMAIL_GATEWAY) private readonly gateway: EmailGateway,
    private readonly config: ConfigService,
  ) {}

  async sendCaretakerInvite(
    email: string,
    firstName: string,
    landlordName: string,
    propertyNames: string[],
    token: string,
  ) {
    const link = `${this.webAppUrl()}/invitations/caretaker?token=${token}`;
    const properties = propertyNames.join(", ");
    await this.gateway.sendEmail(
      email,
      `${APP_NAME}: you've been invited to help manage ${properties}`,
      `Hi ${firstName},\n\n${landlordName} has invited you to join Makazi to help manage ${properties}.\n\n` +
        `Get started here: ${link}\n\nThis link expires in 14 days.`,
    );
  }

  async sendTenantInvite(
    email: string,
    firstName: string,
    context: { propertyName: string; unitCode: string; rentAmount: string } | null,
    tenantCode: string,
  ) {
    const link = `${this.webAppUrl()}/claim-tenant?code=${tenantCode}`;
    const body = context
      ? `Hi ${firstName},\n\nYour landlord has registered you on Makazi for ${context.propertyName}, unit ${context.unitCode} (rent: ${context.rentAmount}).\n\n` +
        `Set up your account here: ${link}`
      : `Hi ${firstName},\n\nYour landlord has registered you on Makazi.\n\nSet up your account here: ${link}`;
    await this.gateway.sendEmail(email, `${APP_NAME}: you've been registered by your landlord`, body);
  }

  private webAppUrl() {
    return this.config.get<string>("WEB_APP_URL", "http://localhost:3000");
  }
}
