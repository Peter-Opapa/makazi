import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { SmsGateway } from "./sms-gateway.types";

/**
 * Real Africa's Talking Bulk SMS client — the standard SMS gateway for
 * Kenya. Requires AFRICASTALKING_API_KEY/USERNAME; falls back to
 * SmsSimulatorService when unset (see IntegrationsModule's gateway provider).
 */
@Injectable()
export class AfricasTalkingSmsService implements SmsGateway {
  private readonly logger = new Logger(AfricasTalkingSmsService.name);

  constructor(private readonly config: ConfigService) {}

  async sendSms(to: string, message: string): Promise<void> {
    const body = new URLSearchParams({
      username: this.config.getOrThrow<string>("AFRICASTALKING_USERNAME"),
      to,
      message,
    });
    const senderId = this.config.get<string>("AFRICASTALKING_SENDER_ID");
    if (senderId) body.set("from", senderId);

    const res = await fetch(`${this.baseUrl()}/version1/messaging`, {
      method: "POST",
      headers: {
        apiKey: this.config.getOrThrow<string>("AFRICASTALKING_API_KEY"),
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
    });

    const json = await res.json();
    if (!res.ok) {
      this.logger.error(`Africa's Talking SMS failed: ${res.status} ${JSON.stringify(json)}`);
      throw new Error("Failed to send SMS");
    }

    const recipients = json?.SMSMessageData?.Recipients ?? [];
    const failed = recipients.filter((r: { status: string }) => r.status !== "Success");
    if (failed.length > 0) {
      this.logger.warn(`Africa's Talking SMS partially failed: ${JSON.stringify(failed)}`);
    }
  }

  private baseUrl(): string {
    return this.config.get<string>("AFRICASTALKING_BASE_URL", "https://api.sandbox.africastalking.com");
  }
}
