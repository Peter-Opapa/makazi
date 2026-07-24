import { IsString, Matches } from "class-validator";

export class PresignPhotoDto {
  @IsString()
  @Matches(/^image\/(jpeg|png|webp|gif)$/, { message: "Only jpeg, png, webp or gif images are allowed" })
  contentType!: string;
}
