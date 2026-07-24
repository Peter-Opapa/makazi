export interface StkPushRequest {
  /** The paying property's own PayBill/Till shortcode — never a Makazi account. */
  businessShortCode: string;
  /** MSISDN in 2547XXXXXXXX format. */
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
}

export interface StkPushResult {
  merchantRequestId: string;
  checkoutRequestId: string;
  responseCode: string;
  responseDescription: string;
  customerMessage: string;
}

export interface SimulateExternalConfirmationInput {
  businessShortCode: string;
  amount: number;
  accountReference: string;
  payerPhone: string;
}

/** Implemented by both the real Daraja client and the simulator — callers never know which one they got. */
export interface PaymentGateway {
  initiateStkPush(request: StkPushRequest): Promise<StkPushResult>;
  /**
   * USSD/PayBill-direct payments settle out-of-band — Safaricom calls the C2B
   * confirmation webhook on its own when (if) the tenant actually pays.
   * The real gateway has nothing to do here; the simulator fakes that arrival
   * for local testing by looping back to the same webhook.
   */
  simulateExternalConfirmation?(input: SimulateExternalConfirmationInput): void;
}

export const PAYMENT_GATEWAY = Symbol("PAYMENT_GATEWAY");

export interface ParsedStkCallback {
  merchantRequestId: string;
  checkoutRequestId: string;
  resultCode: number;
  resultDesc: string;
  success: boolean;
  mpesaReceiptNumber?: string;
  amount?: number;
  phoneNumber?: string;
}

/** Shared by the real webhook and the simulator's loopback call — same shape either way. */
export function parseStkCallbackPayload(raw: unknown): ParsedStkCallback {
  const body = (raw as { Body?: { stkCallback?: Record<string, unknown> } })?.Body?.stkCallback;
  if (!body) throw new Error("Malformed STK callback payload");

  const items = (body.CallbackMetadata as { Item?: { Name: string; Value: unknown }[] } | undefined)?.Item ?? [];
  const findItem = (name: string) => items.find((i) => i.Name === name)?.Value;

  const resultCode = Number(body.ResultCode);
  return {
    merchantRequestId: String(body.MerchantRequestID),
    checkoutRequestId: String(body.CheckoutRequestID),
    resultCode,
    resultDesc: String(body.ResultDesc),
    success: resultCode === 0,
    mpesaReceiptNumber: findItem("MpesaReceiptNumber") as string | undefined,
    amount: findItem("Amount") as number | undefined,
    phoneNumber: findItem("PhoneNumber") !== undefined ? String(findItem("PhoneNumber")) : undefined,
  };
}

export interface C2bConfirmationPayload {
  TransactionType: string;
  TransID: string;
  TransTime: string;
  TransAmount: string;
  BusinessShortCode: string;
  BillRefNumber: string;
  MSISDN: string;
  FirstName?: string;
  MiddleName?: string;
  LastName?: string;
}
