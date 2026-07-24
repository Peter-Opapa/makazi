import { IsEnum, IsOptional, IsString } from "class-validator";
import { InspectionType } from "@makazi/shared-types";

export class QueryInspectionsDto {
  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsString()
  unitId?: string;

  @IsOptional()
  @IsEnum(InspectionType)
  type?: InspectionType;
}
