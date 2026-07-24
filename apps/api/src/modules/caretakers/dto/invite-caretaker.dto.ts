import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class InviteCaretakerDto {
  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  lastName!: string;

  @IsString()
  @MinLength(1)
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
