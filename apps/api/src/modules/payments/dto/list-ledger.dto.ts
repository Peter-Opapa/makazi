import { IsEnum, IsOptional, IsString } from "class-validator";
import { PaymentStatus } from "@makazi/shared-types";

export class ListLedgerDto {
  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;
}
