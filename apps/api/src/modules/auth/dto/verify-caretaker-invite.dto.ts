import { IsString, MinLength } from "class-validator";

export class VerifyCaretakerInviteDto {
  @IsString()
  @MinLength(1)
  token!: string;
}
