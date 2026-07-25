import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { randomInt } from "crypto";
import { UnitStatus, UserRole } from "@makazi/shared-types";
import { Prisma } from "../../../generated/prisma";
import { PrismaService } from "../../prisma/prisma.service";
import { PropertyAccessService, type ActingUser } from "../../common/services/property-access.service";
import { InvitationEmailService } from "../invitations/invitation-email.service";
import { RegisterTenantDto } from "./dto/register-tenant.dto";
import { UpdateTenantContactDto } from "./dto/update-tenant-contact.dto";

const TENANT_CODE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0/I/1

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly access: PropertyAccessService,
    private readonly invitationEmail: InvitationEmailService,
  ) {}

  /**
   * "Register Tenant" — step 1 of 2 in the approved design's Flow 3. Creates
   * the tenant identity with no unit yet; assigning them to a unit later
   * (UnitsService.assignTenant, via existingTenantId) is step 2. The tenant
   * has no Makazi account yet — they claim one via /auth/claim-tenant using
   * the generated tenantCode, emailed to them below when an address is on
   * file (otherwise the landlord/caretaker relays it directly).
   */
  async registerTenant(actorId: string, dto: RegisterTenantDto) {
    if (dto.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing) throw new ConflictException("Email already registered");
    }

    const tenantCode = await this.generateTenantCode();
    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        email: dto.email,
        role: UserRole.TENANT,
        tenantCode,
        registeredById: actorId,
      },
    });

    if (dto.email) {
      await this.sendInvite(user.id, dto.email, dto.firstName, tenantCode, null);
    }

    return { tenant: this.sanitize(user), tenantCode };
  }

  /** Resends the claim-invitation email for a tenant who hasn't claimed their account yet. */
  async resendInvite(actor: ActingUser, tenantId: string) {
    const tenant = await this.prisma.user.findFirst({ where: { id: tenantId, role: UserRole.TENANT } });
    if (!tenant) throw new NotFoundException("Tenant not found");
    if (tenant.tenantCodeClaimedAt) throw new BadRequestException("This tenant has already joined Makazi.");
    if (!tenant.email) throw new BadRequestException("This tenant has no email on file — share their code directly instead.");

    const authorized =
      tenant.registeredById === actor.id ||
      (await this.prisma.tenancy.findFirst({
        where: { tenantId: tenant.id, active: true, unit: { propertyId: { in: await this.access.accessiblePropertyIds(actor) } } },
      }));
    if (!authorized) throw new NotFoundException("Tenant not found");

    const context = await this.getInviteContext(tenant.id);
    await this.sendInvite(tenant.id, tenant.email, tenant.firstName, tenant.tenantCode!, context);
    return { resent: true };
  }

  /**
   * Tenants relevant to this actor: assigned to one of their accessible
   * properties, OR registered by them but not yet assigned anywhere. Powers
   * both the Tenant List page and the "existing tenant" picker in Assign
   * Tenant — a newly-registered, still-unassigned tenant needs to show up
   * in both places.
   */
  async findMany(user: ActingUser, search?: string) {
    const propertyIds = await this.access.accessiblePropertyIds(user);

    const scopeOr: Prisma.UserWhereInput[] = [
      { tenancies: { some: { unit: { propertyId: { in: propertyIds } } } } },
      { registeredById: user.id, tenancies: { none: {} } },
    ];
    const searchOr: Prisma.UserWhereInput[] = search
      ? [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ]
      : [];

    const tenants = await this.prisma.user.findMany({
      where: {
        role: UserRole.TENANT,
        AND: [{ OR: scopeOr }, ...(searchOr.length ? [{ OR: searchOr }] : [])],
      },
      include: {
        tenancies: {
          where: { active: true },
          include: { unit: { include: { property: { select: { id: true, name: true } } } } },
        },
      },
      orderBy: { firstName: "asc" },
      take: 50,
    });

    return tenants.map((t) => ({ ...this.sanitize(t), tenancies: t.tenancies }));
  }

  /**
   * Deletes a tenant who hasn't claimed their tenantCode yet — frees any
   * unit they'd been assigned to back to VACANT in the same transaction.
   * For a mistaken registration, or one that's no longer going ahead.
   */
  async cancelPendingRegistration(actor: ActingUser, tenantId: string) {
    const tenant = await this.prisma.user.findFirst({ where: { id: tenantId, role: UserRole.TENANT } });
    if (!tenant) throw new NotFoundException("Tenant not found");
    if (tenant.tenantCodeClaimedAt) throw new BadRequestException("This tenant has already joined Makazi.");

    const authorized =
      tenant.registeredById === actor.id ||
      (await this.prisma.tenancy.findFirst({
        where: { tenantId: tenant.id, active: true, unit: { propertyId: { in: await this.access.accessiblePropertyIds(actor) } } },
      }));
    if (!authorized) throw new NotFoundException("Tenant not found");

    await this.prisma.$transaction(async (tx) => {
      const activeTenancies = await tx.tenancy.findMany({ where: { tenantId: tenant.id, active: true } });
      for (const tenancy of activeTenancies) {
        await tx.unit.update({ where: { id: tenancy.unitId }, data: { status: UnitStatus.VACANT } });
      }
      await tx.tenancy.deleteMany({ where: { tenantId: tenant.id } });
      await tx.user.delete({ where: { id: tenant.id } });
    });
  }

  /**
   * Fixes a typo'd email/phone before the tenant claims their tenantCode.
   * Once claimed, their contact info is tied to their own Clerk identity —
   * a landlord/caretaker editing it afterward would desync it from their
   * actual login, so this is rejected once tenantCodeClaimedAt is set.
   */
  async updateContact(actor: ActingUser, tenantId: string, dto: UpdateTenantContactDto) {
    const tenant = await this.prisma.user.findFirst({ where: { id: tenantId, role: UserRole.TENANT } });
    if (!tenant) throw new NotFoundException("Tenant not found");
    if (tenant.tenantCodeClaimedAt) throw new ConflictException("This tenant has already joined Makazi and manages their own contact info.");

    const authorized =
      tenant.registeredById === actor.id ||
      (await this.prisma.tenancy.findFirst({
        where: { tenantId: tenant.id, active: true, unit: { propertyId: { in: await this.access.accessiblePropertyIds(actor) } } },
      }));
    if (!authorized) throw new NotFoundException("Tenant not found");

    if (dto.email && dto.email !== tenant.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing) throw new ConflictException("This email is already associated with a different Makazi account.");
    }
    if (dto.phone && dto.phone !== tenant.phone) {
      const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
      if (existing) throw new ConflictException("This phone number is already associated with a different Makazi account.");
    }

    const updated = await this.prisma.user.update({
      where: { id: tenantId },
      data: { email: dto.email, phone: dto.phone },
    });
    return this.sanitize(updated);
  }

  /** Best-effort — an SMTP hiccup must never fail tenant registration/assignment. */
  async sendInvite(
    tenantId: string,
    email: string,
    firstName: string,
    tenantCode: string,
    context: { propertyName: string; unitCode: string; rentAmount: string } | null,
  ) {
    try {
      await this.invitationEmail.sendTenantInvite(email, firstName, context, tenantCode);
      await this.prisma.user.update({ where: { id: tenantId }, data: { tenantCodeInvitedAt: new Date() } });
    } catch (err) {
      this.logger.error(`Failed to send tenant invite email to ${email}: ${err}`);
    }
  }

  async getInviteContext(tenantId: string) {
    const tenancy = await this.prisma.tenancy.findFirst({
      where: { tenantId, active: true },
      orderBy: { createdAt: "desc" },
      include: { unit: { include: { property: true } } },
    });
    if (!tenancy) return null;
    return {
      propertyName: tenancy.unit.property.name,
      unitCode: tenancy.unit.code,
      rentAmount: tenancy.rentAmount.toString(),
    };
  }

  private async generateTenantCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const suffix = Array.from({ length: 5 }, () => TENANT_CODE_CHARSET[randomInt(TENANT_CODE_CHARSET.length)]).join("");
      const code = `MKZ-${suffix}`;
      const existing = await this.prisma.user.findUnique({ where: { tenantCode: code } });
      if (!existing) return code;
    }
    throw new Error("Could not generate a unique tenant code");
  }

  private sanitize(user: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
    tenantCodeClaimedAt: Date | null;
  }) {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      email: user.email,
      claimed: user.tenantCodeClaimedAt !== null,
    };
  }
}
