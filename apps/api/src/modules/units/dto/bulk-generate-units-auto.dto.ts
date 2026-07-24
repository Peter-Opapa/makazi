import { IsInt, IsNumber, IsOptional, Max, Min } from "class-validator";

export class BulkGenerateUnitsAutoDto {
  @IsInt()
  @Min(1)
  @Max(500)
  totalUnits!: number;

  @IsInt()
  @Min(1)
  @Max(100)
  floors!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultRentAmount?: number;
}
