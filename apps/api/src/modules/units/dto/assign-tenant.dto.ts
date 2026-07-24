import { IsDateString, IsNumber, IsOptional, IsString, Min, MinLength } from "class-validator";

export class AssignTenantDto {
  @IsString()
  @MinLength(1)
  existingTenantId!: string;

  @IsDateString()
  leaseStart!: string;

  @IsOptional()
  @IsDateString()
  leaseEnd?: string;

  @IsNumber()
  @Min(0)
  rentAmount!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  depositAmount?: number;
}
