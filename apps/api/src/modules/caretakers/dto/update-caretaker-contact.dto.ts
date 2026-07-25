import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

/** Only for a caretaker who hasn't claimed their invite yet — see CaretakersService.updateContact. */
export class UpdateCaretakerContactDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  phone?: string;
}
