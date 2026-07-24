import { Body, Controller, Logger, Post } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { parseStkCallbackPayload, type C2bConfirmationPayload } from "./gateway/payment-gateway.types";

/**
 * No JwtAuthGuard here — Safaricom can't hold a Makazi session, so this is
 * deliberately public. In production this needs IP allowlisting and a
 * secret path segment at the infra level; neither is possible from this
 * sandbox, so treat that as a deployment TODO, not something this code does.
 * Safaricom retries deliveries it doesn't get a 200 for, so every handler
 * always acks — errors are logged, never thrown back at the caller.
 */
@Controller("payments/mpesa")
export class PaymentWebhooksController {
  private readonly logger = new Logger(PaymentWebhooksController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("stk-callback")
  async stkCallback(@Body() body: unknown) {
    try {
      const parsed = parseStkCallbackPayload(body);
      await this.paymentsService.handleStkCallback(parsed);
    } catch (err) {
      this.logger.error(`Failed to process STK callback: ${err instanceof Error ? err.message : err}`);
    }
    return { ResultCode: 0, ResultDesc: "Accepted" };
  }

  @Post("c2b/confirmation")
  async c2bConfirmation(@Body() body: C2bConfirmationPayload) {
    try {
      await this.paymentsService.handleC2bConfirmation(body);
    } catch (err) {
      this.logger.error(`Failed to process C2B confirmation: ${err instanceof Error ? err.message : err}`);
    }
    return { ResultCode: 0, ResultDesc: "Accepted" };
  }
}
