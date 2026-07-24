import { IsString } from "class-validator";

export class UpdateTicketNotesDto {
  @IsString()
  notes!: string;
}
