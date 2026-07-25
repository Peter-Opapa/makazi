import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

/** Only for a tenant who hasn't claimed their tenantCode yet — see TenantsService.updateContact. */
export class UpdateTenantContactDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  phone?: string;
}
