import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, ValidateNested } from "class-validator";
import { CreateUnitDto } from "./create-unit.dto";

export class BulkGenerateUnitsManualDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => CreateUnitDto)
  units!: CreateUnitDto[];
}
