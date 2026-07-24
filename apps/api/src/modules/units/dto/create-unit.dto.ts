import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from "class-validator";
import { UnitStatus } from "@makazi/shared-types";

export class CreateUnitDto {
  @IsString()
  @MinLength(1)
  code!: string;

  @IsOptional()
  @IsInt()
  floor?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rentAmount?: number;

  @IsOptional()
  @IsEnum(UnitStatus)
  status?: UnitStatus;
}
