import { IsEnum } from "class-validator";
import { AdminSubRole } from "@makazi/shared-types";

export class UpdateSubRoleDto {
  @IsEnum(AdminSubRole)
  subRole!: AdminSubRole;
}
