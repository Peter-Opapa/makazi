import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/** For the three endpoints a brand-new Clerk sign-up hits before any Prisma User row exists for them (see ClerkIdentityStrategy). */
@Injectable()
export class ClerkIdentityGuard extends AuthGuard("clerk-identity") {}
