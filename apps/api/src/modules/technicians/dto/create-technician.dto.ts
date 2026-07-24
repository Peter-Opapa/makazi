import { IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { MaintenanceCategory } from "@makazi/shared-types";

export class CreateTechnicianDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  phone!: string;

  @IsOptional()
  @IsEnum(MaintenanceCategory)
  specialty?: MaintenanceCategory;

  /** Required when a caretaker (who may serve multiple landlords) creates a technician — resolves whose roster this belongs to. */
  @IsOptional()
  @IsString()
  propertyId?: string;
}
