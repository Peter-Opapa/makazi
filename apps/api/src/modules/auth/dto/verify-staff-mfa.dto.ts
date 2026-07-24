import { IsEmail, IsString, Matches } from "class-validator";

export class VerifyStaffMfaDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  @Matches(/^\d{6}$/, { message: "Code must be 6 digits" })
  code!: string;
}
