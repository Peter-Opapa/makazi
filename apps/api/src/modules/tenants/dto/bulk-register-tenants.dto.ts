import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsEmail, IsOptional, IsString, MinLength, ValidateNested } from "class-validator";

class BulkTenantRowDto {
  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  lastName!: string;

  @IsString()
  @MinLength(1)
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class BulkRegisterTenantsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => BulkTenantRowDto)
  rows!: BulkTenantRowDto[];
}
