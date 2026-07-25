import { IsString, MinLength } from "class-validator";

export class ConfirmMeLogoDto {
  @IsString()
  @MinLength(1)
  key!: string;
}
