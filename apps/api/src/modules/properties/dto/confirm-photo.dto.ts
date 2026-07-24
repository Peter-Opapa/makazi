import { IsString, MinLength } from "class-validator";

export class ConfirmPhotoDto {
  @IsString()
  @MinLength(1)
  key!: string;
}
