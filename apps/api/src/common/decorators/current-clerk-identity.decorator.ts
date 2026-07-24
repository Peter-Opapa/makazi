import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

/** Populated by ClerkIdentityStrategy — a verified Clerk identity with no Prisma User row required (unlike CurrentUser). */
export interface ClerkIdentity {
  clerkUserId: string;
  email: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
}

export const CurrentClerkIdentity = createParamDecorator((_data: unknown, ctx: ExecutionContext): ClerkIdentity => {
  const request = ctx.switchToHttp().getRequest<Request & { user: ClerkIdentity }>();
  return request.user;
});
