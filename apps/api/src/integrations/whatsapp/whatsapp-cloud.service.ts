import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { WhatsAppGateway } from "./whatsapp-gateway.types";

/**
 * Real Meta WhatsApp Business Cloud API client. Requires
 * WHATSAPP_ACCESS_TOKEN/PHONE_NUMBER_ID plus a message template pre-approved
 * in Meta Business Manager (business-initiated messages can't be free text —
 * see whatsapp-gateway.types.ts). This is architecture only: getting a real
 * WhatsApp Business number through Meta's review process is a separate,
 * non-technical onboarding step this sandbox can't do for you.
 */
@Injectable()
export class WhatsAppCloudService implements WhatsAppGateway {
  private readonly logger = new Logger(WhatsAppCloudService.name);

  constructor(private readonly config: ConfigService) {}

  async sendTemplateMessage(to: string, templateName: string, params: string[]): Promise<void> {
    const phoneNumberId = this.config.getOrThrow<string>("WHATSAPP_PHONE_NUMBER_ID");
    const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.getOrThrow<string>("WHATSAPP_ACCESS_TOKEN")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: "en_US" },
          components: [
            {
              type: "body",
              parameters: params.map((text) => ({ type: "text", text })),
            },
          ],
        },
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      this.logger.error(`WhatsApp send failed: ${res.status} ${JSON.stringify(json)}`);
      throw new Error("Failed to send WhatsApp message");
    }
  }
}
