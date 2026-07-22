import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

export interface AuthenticatedUser {
  id: string;
  role: string;
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
  const request = ctx.switchToHttp().getRequest<Request & { user: AuthenticatedUser }>();
  return request.user;
});
