import { IsString, MinLength } from "class-validator";

export class VerifyTenantCodeDto {
  @IsString()
  @MinLength(1)
  tenantCode!: string;
}
