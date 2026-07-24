import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { randomInt } from "crypto";
import * as bcrypt from "bcrypt";
import { UserRole } from "@makazi/shared-types";
import { PrismaService } from "../../../prisma/prisma.service";
import { EmailService } from "../../auth/email.service";
import { AuditLogService } from "../../audit-log/audit-log.service";

const OTP_TTL_MINUTES = 15;
const SALT_ROUNDS = 10;

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly auditLog: AuditLogService,
  ) {}

  async list(role: UserRole | undefined, search: string | undefined) {
    const users = await this.prisma.user.findMany({
      where: {
        ...(role ? { role } : {}),
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        adminSubRole: true,
        suspendedAt: true,
        identityVerifiedAt: true,
        createdAt: true,
      },
      take: 200,
    });

    return users.map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      phone: u.phone,
      role: u.role,
      adminSubRole: u.adminSubRole,
      status: u.suspendedAt ? "suspended" : "active",
      verified: !!u.identityVerifiedAt,
      joined: u.createdAt,
    }));
  }

  async getDetail(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");

    const [ticketCount, activeTenancy, propertiesOwnedCount, caretakerPropertyCount] = await Promise.all([
      this.prisma.supportTicket.count({ where: { customerId: id } }),
      user.role === UserRole.TENANT
        ? this.prisma.tenancy.findFirst({
            where: { tenantId: id, active: true },
            include: { unit: { include: { property: true } } },
            orderBy: { createdAt: "desc" },
          })
        : null,
      user.role === UserRole.LANDLORD ? this.prisma.property.count({ where: { landlordId: id } }) : null,
      user.role === UserRole.CARETAKER
        ? this.prisma.caretakerAssignment.count({ where: { caretakerId: id, inviteStatus: "ACCEPTED" } })
        : null,
    ]);

    const context =
      user.role === UserRole.TENANT
        ? activeTenancy
          ? `${activeTenancy.unit.property.name} · ${activeTenancy.unit.code}`
          : "No active tenancy"
        : user.role === UserRole.LANDLORD
          ? `${propertiesOwnedCount ?? 0} propert${propertiesOwnedCount === 1 ? "y" : "ies"}`
          : user.role === UserRole.CARETAKER
            ? `${caretakerPropertyCount ?? 0} propert${caretakerPropertyCount === 1 ? "y" : "ies"} assigned`
            : "—";

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      adminSubRole: user.adminSubRole,
      status: user.suspendedAt ? "suspended" : "active",
      verified: !!user.identityVerifiedAt,
      joined: user.createdAt,
      context,
      supportTicketCount: ticketCount,
    };
  }

  async setSuspended(actorId: string, id: string, suspended: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    if (user.id === actorId) throw new BadRequestException("You cannot suspend your own account");

    const updated = await this.prisma.user.update({
      where: { id },
      data: { suspendedAt: suspended ? new Date() : null },
    });

    await this.auditLog.record({
      actorId,
      action: suspended ? "Suspended user" : "Reactivated user",
      targetType: "User",
      targetId: id,
      metadata: { name: `${user.firstName} ${user.lastName}` },
    });

    return { status: updated.suspendedAt ? "suspended" : "active" };
  }

  async verifyIdentity(actorId: string, id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");

    await this.prisma.user.update({ where: { id }, data: { identityVerifiedAt: new Date() } });

    await this.auditLog.record({
      actorId,
      action: "Verified identity",
      targetType: "User",
      targetId: id,
      metadata: { name: `${user.firstName} ${user.lastName}` },
    });

    return { verified: true };
  }

  async resetPassword(actorId: string, id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    if (!user.email) throw new BadRequestException("This account has no email on file to send a reset code to");

    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    const passwordResetCodeHash = await bcrypt.hash(code, SALT_ROUNDS);
    const passwordResetExpiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000);

    await this.prisma.user.update({ where: { id }, data: { passwordResetCodeHash, passwordResetExpiresAt } });
    await this.email.sendPasswordResetCode(user.email, code);

    await this.auditLog.record({
      actorId,
      action: "Reset password",
      targetType: "User",
      targetId: id,
      metadata: { name: `${user.firstName} ${user.lastName}` },
    });

    return { message: "Password reset code sent to the user's email" };
  }
}
