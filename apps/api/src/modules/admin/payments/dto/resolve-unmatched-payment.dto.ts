import { IsString, MinLength } from "class-validator";

export class ResolveUnmatchedPaymentAdminDto {
  @IsString()
  @MinLength(1)
  tenancyId!: string;
}
