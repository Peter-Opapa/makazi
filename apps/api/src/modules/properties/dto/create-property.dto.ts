import { IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { PropertyType } from "@makazi/shared-types";

export class CreatePropertyDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  location!: string;

  @IsOptional()
  @IsString()
  county?: string;

  @IsOptional()
  @IsString()
  estateArea?: string;

  @IsOptional()
  @IsString()
  physicalAddress?: string;

  @IsEnum(PropertyType)
  propertyType!: PropertyType;
}
