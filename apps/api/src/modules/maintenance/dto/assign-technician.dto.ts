import { IsString, MinLength } from "class-validator";

export class AssignTechnicianDto {
  @IsString()
  @MinLength(1)
  technicianId!: string;
}
