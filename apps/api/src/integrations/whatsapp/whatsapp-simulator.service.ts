import { Injectable, Logger } from "@nestjs/common";
import type { WhatsAppGateway } from "./whatsapp-gateway.types";

/** Stands in for WhatsAppCloudService when no access token is configured — just logs. */
@Injectable()
export class WhatsAppSimulatorService implements WhatsAppGateway {
  private readonly logger = new Logger("WhatsApp (simulated)");

  async sendTemplateMessage(to: string, templateName: string, params: string[]): Promise<void> {
    this.logger.log(`-> ${to}: [${templateName}] ${params.join(" | ")}`);
  }
}
