import { Injectable, Logger } from "@nestjs/common";
import type { SmsGateway } from "./sms-gateway.types";

/** Stands in for AfricasTalkingSmsService when no API key is configured — just logs. */
@Injectable()
export class SmsSimulatorService implements SmsGateway {
  private readonly logger = new Logger("SMS (simulated)");

  async sendSms(to: string, message: string): Promise<void> {
    this.logger.log(`-> ${to}: ${message}`);
  }
}
