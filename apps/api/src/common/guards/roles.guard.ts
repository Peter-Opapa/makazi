import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "@makazi/shared-types";
import { ROLES_KEY } from "../decorators/roles.decorator";
import type { AuthenticatedUser } from "../decorators/current-user.decorator";

/**
 * Server-side role gate. The design prototype's Admin "role switcher" is
 * cosmetic only — it changes what's displayed but nothing is actually
 * enforced (see 10-implementation-notes.md). This guard is the real thing;
 * do not rely on hiding UI elements alone.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    if (!user || !requiredRoles.includes(user.role as UserRole)) {
      throw new ForbiddenException("Insufficient role for this action");
    }

    return true;
  }
}
