import { SetMetadata } from "@nestjs/common";
import { AdminPermission } from "@makazi/shared-types";

export const ADMIN_PERMISSION_KEY = "adminPermission";

/** Marks a mutating Admin Portal route as requiring a specific AdminPermission — checked live by AdminPermissionGuard. */
export const RequireAdminPermission = (permission: AdminPermission) => SetMetadata(ADMIN_PERMISSION_KEY, permission);
