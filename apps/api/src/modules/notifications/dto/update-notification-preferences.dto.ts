import { IsBoolean, IsOptional } from "class-validator";

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  paymentsSms?: boolean;

  @IsOptional()
  @IsBoolean()
  paymentsEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  paymentsWhatsapp?: boolean;

  @IsOptional()
  @IsBoolean()
  maintenanceSms?: boolean;

  @IsOptional()
  @IsBoolean()
  maintenanceEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  maintenanceWhatsapp?: boolean;

  @IsOptional()
  @IsBoolean()
  accountSms?: boolean;

  @IsOptional()
  @IsBoolean()
  accountEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  accountWhatsapp?: boolean;
}
