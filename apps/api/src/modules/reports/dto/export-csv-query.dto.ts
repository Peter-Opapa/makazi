import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

const EXPORT_TYPES = ["occupancy", "income", "vacancies", "payments", "maintenance"] as const;
export type ReportExportType = (typeof EXPORT_TYPES)[number];

export class ExportCsvQueryDto {
  @IsIn(EXPORT_TYPES)
  type!: ReportExportType;

  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  months?: number = 12;
}
