import { IsBoolean, IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { MaintenanceCategory } from "@makazi/shared-types";

export class UpdateTechnicianDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  phone?: string;

  @IsOptional()
  @IsEnum(MaintenanceCategory)
  specialty?: MaintenanceCategory;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
