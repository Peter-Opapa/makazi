import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional } from "class-validator";
import { UnitStatus } from "@makazi/shared-types";

export class QueryUnitsDto {
  @IsOptional()
  @IsEnum(UnitStatus)
  status?: UnitStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  floor?: number;
}
