import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "crypto";
import * as bcrypt from "bcrypt";
import { AdminSubRole, UserRole } from "@makazi/shared-types";
import { PrismaService } from "../../../prisma/prisma.service";
import { AuditLogService } from "../../audit-log/audit-log.service";

const SALT_ROUNDS = 10;

@Injectable()
export class AdminRolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async listStaff() {
    const staff = await this.prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      orderBy: { createdAt: "asc" },
      select: { id: true, firstName: true, lastName: true, email: true, adminSubRole: true, suspendedAt: true, createdAt: true },
    });
    return staff.map((s) => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      email: s.email,
      subRole: s.adminSubRole,
      status: s.suspendedAt ? "suspended" : "active",
      joined: s.createdAt,
    }));
  }

  /**
   * Admins cannot self-register (AuthService.requestRegistrationOtp rejects
   * role=ADMIN) — this is the only way a new staff account is created. The
   * temp password is returned once, in the response, for the Super Admin to
   * relay out-of-band (same "relay a code the recipient uses once" pattern
   * as tenantCode); the new hire then uses Forgot Password on first login to
   * set their own, matching the "Known Simplifications" no-real-MFA-enrollment
   * posture already documented for staff login.
   */
  async createStaff(
    actorId: string,
    dto: { firstName: string; lastName: string; email: string; subRole: AdminSubRole },
  ) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException("Email already registered");

    const tempPassword = randomBytes(9).toString("base64url");
    const passwordHash = await bcrypt.hash(tempPassword, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        role: UserRole.ADMIN,
        adminSubRole: dto.subRole,
        passwordHash,
        emailVerifiedAt: new Date(),
      },
    });

    await this.auditLog.record({
      actorId,
      action: "Created staff account",
      targetType: "User",
      targetId: user.id,
      metadata: { name: `${dto.firstName} ${dto.lastName}`, subRole: dto.subRole },
    });

    return {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      subRole: user.adminSubRole,
      tempPassword,
    };
  }

  async updateSubRole(actorId: string, id: string, subRole: AdminSubRole) {
    const staff = await this.prisma.user.findUnique({ where: { id } });
    if (!staff || staff.role !== UserRole.ADMIN) throw new NotFoundException("Staff account not found");
    if (staff.id === actorId && subRole !== AdminSubRole.SUPER_ADMIN) {
      throw new BadRequestException("You cannot demote your own account");
    }

    const updated = await this.prisma.user.update({ where: { id }, data: { adminSubRole: subRole } });

    await this.auditLog.record({
      actorId,
      action: "Changed admin role",
      targetType: "User",
      targetId: id,
      metadata: { name: `${staff.firstName} ${staff.lastName}`, subRole },
    });

    return { id: updated.id, subRole: updated.adminSubRole };
  }
}
