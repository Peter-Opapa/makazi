import { IsOptional, IsString, MaxLength } from "class-validator";

export class RequestExitDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
