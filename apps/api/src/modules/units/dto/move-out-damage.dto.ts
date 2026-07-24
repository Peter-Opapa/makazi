import { IsOptional, IsString } from "class-validator";

export class MoveOutDamageDto {
  @IsOptional()
  @IsString()
  damageNotes?: string;
}
