import { IsString, MinLength } from "class-validator";

export class ResolveUnmatchedPaymentDto {
  @IsString()
  @MinLength(1)
  tenancyId!: string;
}
