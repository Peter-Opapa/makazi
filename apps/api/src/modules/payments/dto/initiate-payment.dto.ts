import { IsEnum } from "class-validator";
import { PaymentChannel } from "@makazi/shared-types";

export class InitiatePaymentDto {
  @IsEnum(PaymentChannel)
  channel!: PaymentChannel;
}
