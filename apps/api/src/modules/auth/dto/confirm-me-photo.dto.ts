import { IsString, MinLength } from "class-validator";

export class ConfirmMePhotoDto {
  @IsString()
  @MinLength(1)
  key!: string;
}
