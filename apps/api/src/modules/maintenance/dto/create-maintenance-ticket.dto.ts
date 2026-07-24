import { IsArray, IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { MaintenanceCategory, MaintenancePriority } from "@makazi/shared-types";

export class CreateMaintenanceTicketDto {
  @IsString()
  @MinLength(1)
  unitId!: string;

  @IsString()
  @MinLength(1)
  issue!: string;

  @IsOptional()
  @IsEnum(MaintenanceCategory)
  category?: MaintenanceCategory;

  @IsOptional()
  @IsEnum(MaintenancePriority)
  priority?: MaintenancePriority;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];
}
