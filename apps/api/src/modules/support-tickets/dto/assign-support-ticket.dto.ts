import { IsOptional, IsString } from "class-validator";

export class AssignSupportTicketDto {
  /** Omit or null to unassign ("Unassigned" in the design prototype's agent select). */
  @IsOptional()
  @IsString()
  agentId?: string | null;
}
