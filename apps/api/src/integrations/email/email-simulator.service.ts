import { Injectable, Logger } from "@nestjs/common";
import type { EmailGateway } from "./email-gateway.types";

/** Stands in for SmtpEmailService when no SMTP host is configured — just logs. */
@Injectable()
export class EmailSimulatorService implements EmailGateway {
  private readonly logger = new Logger("Email (simulated)");

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    this.logger.log(`-> ${to}: [${subject}] ${body}`);
  }
}
