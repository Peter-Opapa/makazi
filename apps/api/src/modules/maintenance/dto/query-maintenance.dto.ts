import { IsEnum, IsOptional, IsString } from "class-validator";
import { MaintenanceCategory, MaintenancePriority, MaintenanceStatus } from "@makazi/shared-types";

export class QueryMaintenanceDto {
  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @IsOptional()
  @IsEnum(MaintenancePriority)
  priority?: MaintenancePriority;

  @IsOptional()
  @IsEnum(MaintenanceCategory)
  category?: MaintenanceCategory;
}
