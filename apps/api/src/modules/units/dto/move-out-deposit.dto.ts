import { IsNumber, IsOptional, Min } from "class-validator";

export class MoveOutDepositDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  depositDeductions?: number;
}
