import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomInt, randomUUID } from "crypto";
import type {
  PaymentGateway,
  SimulateExternalConfirmationInput,
  StkPushRequest,
  StkPushResult,
} from "./payment-gateway.types";

const STK_SUCCESS_RATE = 0.8;
/** Lower than STK's — a passive/out-of-band payment more often just doesn't happen at all, which isn't a "failure", it's simply "not paid yet". */
const EXTERNAL_CONFIRMATION_RATE = 0.6;

/**
 * Stands in for DarajaGatewayService when no real credentials are configured
 * (see PaymentsModule). Doesn't skip the callback path to fake a result —
 * it does a real HTTP loopback POST to DARAJA_CALLBACK_URL after a delay,
 * in the exact shape Safaricom's STK callback uses, so the webhook
 * controller and PaymentsService.handleStkCallback are exercised for real.
 * Swapping this for DarajaGatewayService later is a config change only.
 */
@Injectable()
export class DarajaSimulatorService implements PaymentGateway {
  private readonly logger = new Logger(DarajaSimulatorService.name);

  constructor(private readonly config: ConfigService) {}

  async initiateStkPush(request: StkPushRequest): Promise<StkPushResult> {
    const merchantRequestId = `sim-mr-${randomUUID()}`;
    const checkoutRequestId = `ws_CO_SIM_${Date.now()}${randomInt(1000, 9999)}`;
    const delayMs = 3000 + Math.floor(Math.random() * 1500);

    setTimeout(() => {
      this.deliverCallback(merchantRequestId, checkoutRequestId, request).catch((err) =>
        this.logger.error(`Simulated STK callback delivery failed: ${err}`),
      );
    }, delayMs);

    return {
      merchantRequestId,
      checkoutRequestId,
      responseCode: "0",
      responseDescription: "Success. Request accepted for processing",
      customerMessage: "Success. Request accepted for processing. Simulated — no real M-Pesa prompt was sent.",
    };
  }

  simulateExternalConfirmation(input: SimulateExternalConfirmationInput): void {
    const delayMs = 4000 + Math.floor(Math.random() * 4000);
    setTimeout(() => {
      this.deliverC2bConfirmation(input).catch((err) => this.logger.error(`Simulated C2B confirmation delivery failed: ${err}`));
    }, delayMs);
  }

  private async deliverC2bConfirmation(input: SimulateExternalConfirmationInput) {
    if (Math.random() >= EXTERNAL_CONFIRMATION_RATE) return; // simulates the tenant simply not having paid (yet)

    const payload = {
      TransactionType: "Pay Bill",
      TransID: `SIM${randomInt(100_000_000, 999_999_999)}`,
      TransTime: this.formatTimestamp(new Date()),
      TransAmount: String(input.amount),
      BusinessShortCode: input.businessShortCode,
      BillRefNumber: input.accountReference,
      MSISDN: input.payerPhone,
      FirstName: "Simulated",
      LastName: "Tenant",
    };

    const url = this.config.getOrThrow<string>("DARAJA_C2B_CONFIRMATION_URL");
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) this.logger.warn(`Simulated C2B confirmation loopback returned ${res.status}`);
  }

  private async deliverCallback(merchantRequestId: string, checkoutRequestId: string, request: StkPushRequest) {
    const succeeds = Math.random() < STK_SUCCESS_RATE;
    const body = succeeds
      ? {
          Body: {
            stkCallback: {
              MerchantRequestID: merchantRequestId,
              CheckoutRequestID: checkoutRequestId,
              ResultCode: 0,
              ResultDesc: "The service request is processed successfully.",
              CallbackMetadata: {
                Item: [
                  { Name: "Amount", Value: request.amount },
                  { Name: "MpesaReceiptNumber", Value: `SIM${randomInt(10_000_000, 99_999_999)}` },
                  { Name: "TransactionDate", Value: Number(this.formatTimestamp(new Date())) },
                  { Name: "PhoneNumber", Value: Number(request.phoneNumber) },
                ],
              },
            },
          },
        }
      : {
          Body: {
            stkCallback: {
              MerchantRequestID: merchantRequestId,
              CheckoutRequestID: checkoutRequestId,
              ResultCode: 1032,
              ResultDesc: "Request cancelled by user.",
            },
          },
        };

    const callbackUrl = this.config.getOrThrow<string>("DARAJA_CALLBACK_URL");
    const res = await fetch(callbackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) this.logger.warn(`Simulated STK callback loopback returned ${res.status}`);
  }

  private formatTimestamp(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  }
}
