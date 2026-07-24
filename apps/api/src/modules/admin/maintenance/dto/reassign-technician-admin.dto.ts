import { IsString, MinLength } from "class-validator";

export class ReassignTechnicianAdminDto {
  @IsString()
  @MinLength(1)
  technicianId!: string;
}
