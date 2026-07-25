import { IsIn, IsOptional, IsString, MinLength, ValidateIf } from "class-validator";

export class UpsertPaymentChannelTemplateDto {
  @IsString()
  @MinLength(1, { message: "Give this channel a label, e.g. \"Main M-Pesa Till\"" })
  label!: string;

  @IsIn(["paybill", "till", "bank"])
  method!: "paybill" | "till" | "bank";

  @ValidateIf((dto: UpsertPaymentChannelTemplateDto) => dto.method === "paybill" || dto.method === "bank")
  @IsString()
  @MinLength(1, { message: "Business number is required for this payment method" })
  payBillNumber?: string;

  @ValidateIf((dto: UpsertPaymentChannelTemplateDto) => dto.method === "till")
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
