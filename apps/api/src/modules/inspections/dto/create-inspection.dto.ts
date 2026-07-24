import { IsArray, IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { InspectionType } from "@makazi/shared-types";

export class CreateInspectionDto {
  @IsString()
  @MinLength(1)
  unitId!: string;

  @IsEnum(InspectionType)
  type!: InspectionType;

  @IsOptional()
  checklist?: Record<string, "ok" | "damaged">;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];
}
