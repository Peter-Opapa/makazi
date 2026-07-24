import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * Tries our own JWT first (Admin/staff), then a Clerk session token
 * (Landlord/Caretaker/Tenant) — see ClerkStrategy. Both resolve to the same
 * {id, role} shape, so every existing controller using this guard works
 * unchanged regardless of which one actually authenticated the request.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard(["jwt", "clerk"]) {}
