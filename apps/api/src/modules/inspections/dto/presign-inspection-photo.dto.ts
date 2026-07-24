import { IsString, Matches, MinLength } from "class-validator";

export class PresignInspectionPhotoDto {
  @IsString()
  @MinLength(1)
  unitId!: string;

  @IsString()
  @Matches(/^image\/(jpeg|png|webp|gif)$/, { message: "Only jpeg, png, webp or gif images are allowed" })
  contentType!: string;
}
