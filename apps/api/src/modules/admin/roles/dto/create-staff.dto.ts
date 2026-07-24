import { IsEmail, IsEnum, IsString, MinLength } from "class-validator";
import { AdminSubRole } from "@makazi/shared-types";

export class CreateStaffDto {
  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsEnum(AdminSubRole)
  subRole!: AdminSubRole;
}
