import { IsArray, IsOptional, IsString } from "class-validator";

export class MoveOutInspectDto {
  @IsOptional()
  checklist?: Record<string, "ok" | "damaged">;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];
}
