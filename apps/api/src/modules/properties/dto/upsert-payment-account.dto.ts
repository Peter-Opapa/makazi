import { IsIn, IsOptional, IsString, MinLength, ValidateIf } from "class-validator";

// Every method still settles via an M-Pesa-reachable shortcode — "bank" means
// a bank's own PayBill number (e.g. KCB Paybill), not an untracked wire
// transfer, since Makazi can only reconcile what Safaricom confirms.
export class UpsertPaymentAccountDto {
  @IsIn(["paybill", "till", "bank"])
  method!: "paybill" | "till" | "bank";

  @ValidateIf((dto: UpsertPaymentAccountDto) => dto.method === "paybill" || dto.method === "bank")
  @IsString()
  @MinLength(1, { message: "Business number is required for this payment method" })
  payBillNumber?: string;

  @ValidateIf((dto: UpsertPaymentAccountDto) => dto.method === "till")
  @IsString()
  @MinLength(1, { message: "Till number is required for this payment method" })
  tillNumber?: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  bankAccountNumber?: string;
}
