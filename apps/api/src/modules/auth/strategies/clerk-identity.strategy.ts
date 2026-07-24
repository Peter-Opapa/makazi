import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-custom";
import { ExtractJwt } from "passport-jwt";
import { createClerkClient, verifyToken, type ClerkClient } from "@clerk/backend";
import type { Request } from "express";
import type { ClerkIdentity } from "../../../common/decorators/current-clerk-identity.decorator";

/**
 * Verifies a Clerk session token like ClerkStrategy, but does NOT require an
 * existing Prisma User row — used only by the three "not signed up with
 * Makazi yet" endpoints (clerk/me, clerk/complete-profile, clerk/claim-tenant)
 * a brand-new Clerk identity needs before any User row exists for them.
 */
@Injectable()
export class ClerkIdentityStrategy extends PassportStrategy(Strategy, "clerk-identity") {
  private readonly clerkClient: ClerkClient;

  constructor(private readonly config: ConfigService) {
    super();
    this.clerkClient = createClerkClient({ secretKey: this.config.getOrThrow<string>("CLERK_SECRET_KEY") });
  }

  async validate(req: Request): Promise<ClerkIdentity> {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (!token) throw new UnauthorizedException();

    const claims = await verifyToken(token, { secretKey: this.config.getOrThrow<string>("CLERK_SECRET_KEY") }).catch(
      () => null,
    );
    if (!claims) throw new UnauthorizedException("Invalid session");

    const clerkUser = await this.clerkClient.users.getUser(claims.sub);

    return {
      clerkUserId: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
      firstName: clerkUser.firstName ?? "",
      lastName: clerkUser.lastName ?? "",
      phone: clerkUser.primaryPhoneNumber?.phoneNumber ?? null,
    };
  }
}
