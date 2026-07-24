import { IsOptional, IsString, MinLength } from "class-validator";

/**
 * Landlord-only — see AuthService.completeClerkProfile. Email/password are
 * already collected by Clerk's own sign-up widget; phone is always missing
 * (Clerk doesn't collect it here) and name is prefilled from Clerk when
 * available but re-collected as a fallback — not every Clerk instance
 * configuration captures a name during email/password sign-up (e.g. it's
 * absent unless "Name" is enabled as a required attribute in the Clerk
 * Dashboard), so this can't be assumed always present.
 */
export class CompleteClerkProfileDto {
  @IsString()
  @MinLength(1)
  phone!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  lastName?: string;
}
