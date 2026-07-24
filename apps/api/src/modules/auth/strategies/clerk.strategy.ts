import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-custom";
import { ExtractJwt } from "passport-jwt";
import { verifyToken } from "@clerk/backend";
import type { Request } from "express";
import { PrismaService } from "../../../prisma/prisma.service";

/**
 * Verifies a Clerk-issued session token (Landlord/Caretaker/Tenant only —
 * Admin/staff never has a Clerk identity, see JwtStrategy for that path)
 * and resolves it to the same {id, role} shape JwtStrategy returns, so every
 * existing `@UseGuards(JwtAuthGuard, ...)` call site in the app works
 * unchanged regardless of which strategy actually authenticated the request
 * — see JwtAuthGuard, which tries "jwt" then "clerk".
 *
 * Requires an existing User row already linked via clerkUserId. A brand-new
 * Clerk identity with no matching row (hasn't finished "Choose Role" yet)
 * is rejected here — see ClerkIdentityStrategy for the lighter-weight guard
 * used by the profile-completion/tenant-claim endpoints that don't need an
 * existing Prisma User.
 */
@Injectable()
export class ClerkStrategy extends PassportStrategy(Strategy, "clerk") {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async validate(req: Request) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (!token) throw new UnauthorizedException();

    const claims = await verifyToken(token, { secretKey: this.config.getOrThrow<string>("CLERK_SECRET_KEY") }).catch(
      () => null,
    );
    if (!claims) throw new UnauthorizedException("Invalid session");

    const user = await this.prisma.user.findUnique({ where: { clerkUserId: claims.sub } });
    if (!user) throw new UnauthorizedException("We couldn't find your account.");
    if (user.suspendedAt) throw new UnauthorizedException("This account has been suspended");

    return { id: user.id, role: user.role };
  }
}
