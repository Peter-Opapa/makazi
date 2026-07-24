import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { PaymentGateway, StkPushRequest, StkPushResult } from "./payment-gateway.types";

/**
 * Real Safaricom Daraja (Lipa Na M-Pesa Online / STK Push) client. Requires
 * DARAJA_CONSUMER_KEY/SECRET and a publicly reachable DARAJA_CALLBACK_URL —
 * see PaymentsModule's gateway provider for how this is selected over the
 * simulator. BusinessShortCode is always the paying property's own PayBill/
 * Till (from PaymentAccount), never a Makazi-controlled account: Makazi never
 * holds customer funds, it only initiates the request and records the
 * outcome. Production use of a single app-wide credential set like this only
 * works once Safaricom has granted API Product access to push to third-party
 * shortcodes (or each landlord supplies their own Daraja credentials) — this
 * client is correct against Daraja's contract either way, that's an
 * onboarding/commercial concern, not a code one.
 */
@Injectable()
export class DarajaGatewayService implements PaymentGateway {
  private readonly logger = new Logger(DarajaGatewayService.name);
  private cachedToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(private readonly config: ConfigService) {}

  async initiateStkPush(request: StkPushRequest): Promise<StkPushResult> {
    const token = await this.getAccessToken();
    const timestamp = this.formatTimestamp(new Date());
    const password = Buffer.from(
      `${request.businessShortCode}${this.config.getOrThrow<string>("DARAJA_PASSKEY")}${timestamp}`,
    ).toString("base64");

    const res = await fetch(`${this.baseUrl()}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        BusinessShortCode: request.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(request.amount),
        PartyA: request.phoneNumber,
        PartyB: request.businessShortCode,
        PhoneNumber: request.phoneNumber,
        CallBackURL: this.config.getOrThrow<string>("DARAJA_CALLBACK_URL"),
        AccountReference: request.accountReference,
        TransactionDesc: request.transactionDesc,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      this.logger.error(`Daraja STK push failed: ${res.status} ${JSON.stringify(json)}`);
      throw new Error(json.errorMessage ?? "Daraja STK push request failed");
    }

    return {
      merchantRequestId: json.MerchantRequestID,
      checkoutRequestId: json.CheckoutRequestID,
      responseCode: json.ResponseCode,
      responseDescription: json.ResponseDescription,
      customerMessage: json.CustomerMessage,
    };
  }

  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && this.tokenExpiresAt > Date.now()) return this.cachedToken;

    const key = this.config.getOrThrow<string>("DARAJA_CONSUMER_KEY");
    const secret = this.config.getOrThrow<string>("DARAJA_CONSUMER_SECRET");
    const basic = Buffer.from(`${key}:${secret}`).toString("base64");

    const res = await fetch(`${this.baseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${basic}` },
    });
    if (!res.ok) throw new Error("Failed to obtain a Daraja access token");
    const json = await res.json();

    this.cachedToken = json.access_token;
    this.tokenExpiresAt = Date.now() + (Number(json.expires_in) - 60) * 1000;
    return this.cachedToken as string;
  }

  private baseUrl(): string {
    return this.config.get<string>("DARAJA_BASE_URL", "https://sandbox.safaricom.co.ke");
  }

  private formatTimestamp(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  }
}
