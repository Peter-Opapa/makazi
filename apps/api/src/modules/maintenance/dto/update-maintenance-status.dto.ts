import { IsEnum, IsOptional, IsString } from "class-validator";
import { MaintenanceStatus } from "@makazi/shared-types";

export class UpdateMaintenanceStatusDto {
  @IsEnum(MaintenanceStatus)
  status!: MaintenanceStatus;

  /** Only meaningful when moving to COMPLETED, but accepted any time so a note can be added before closing. */
  @IsOptional()
  @IsString()
  resolutionNotes?: string;
}
