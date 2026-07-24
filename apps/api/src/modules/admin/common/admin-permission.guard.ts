import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ADMIN_PERMISSION_MATRIX, AdminSubRole } from "@makazi/shared-types";
import { PrismaService } from "../../../prisma/prisma.service";
import { ADMIN_PERMISSION_KEY } from "./admin-permission.decorator";
import type { AuthenticatedUser } from "../../../common/decorators/current-user.decorator";

/**
 * The real per-subrole enforcement the design prototype's cosmetic role
 * switcher stands in for (10-implementation-notes.md: "Enforce this
 * server-side, not just by hiding UI"). Every mutating Admin Portal route
 * carries @RequireAdminPermission(...); this guard re-fetches the caller's
 * adminSubRole and suspendedAt from the database on every request — not
 * from the JWT — so a role change or suspension takes effect immediately
 * rather than waiting for the token to expire. Runs after RolesGuard(ADMIN),
 * so `user.role === ADMIN` is already guaranteed here.
 */
@Injectable()
export class AdminPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.getAllAndOverride<string | undefined>(ADMIN_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!permission) return true;

    const { user } = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    const staff = await this.prisma.user.findUnique({ where: { id: user.id } });
    if (!staff || staff.suspendedAt) throw new UnauthorizedException("This account has been suspended");

    if (staff.adminSubRole === AdminSubRole.SUPER_ADMIN) return true;

    const allowed = ADMIN_PERMISSION_MATRIX[permission as keyof typeof ADMIN_PERMISSION_MATRIX] ?? [];
    if (!staff.adminSubRole || !allowed.includes(staff.adminSubRole as AdminSubRole)) {
      throw new ForbiddenException("Your admin role does not have this permission");
    }

    return true;
  }
}
