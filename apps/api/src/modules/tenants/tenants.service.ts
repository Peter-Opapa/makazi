import { BadRequestException, ConflictException, HttpException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { randomInt } from "crypto";
import { CaretakerInviteStatus, NotificationType, TenancyStatus, UnitStatus, UserRole } from "@makazi/shared-types";
import { Prisma } from "../../../generated/prisma";
import { PrismaService } from "../../prisma/prisma.service";
import { PropertyAccessService, type ActingUser } from "../../common/services/property-access.service";
import { InvitationEmailService } from "../invitations/invitation-email.service";
import { NotificationsService } from "../notifications/notifications.service";
import { RegisterTenantDto } from "./dto/register-tenant.dto";
import { BulkRegisterTenantsDto } from "./dto/bulk-register-tenants.dto";
import { UpdateTenantContactDto } from "./dto/update-tenant-contact.dto";
import { RequestExitDto } from "./dto/request-exit.dto";

const TENANT_CODE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0/I/1

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly access: PropertyAccessService,
    private readonly invitationEmail: InvitationEmailService,
    private readonly notifications: NotificationsService,
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
    // A tenant can rent from several landlords at once. If this email already
    // belongs to a tenant, reuse that profile instead of blocking — the
    // landlord can then assign them a unit, which (for a landlord new to them)
    // creates a PENDING tenancy the tenant must accept. Only a non-tenant
    // collision is a genuine conflict.
    if (dto.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing) {
        if (existing.role !== UserRole.TENANT) {
          throw new ConflictException("This email is already associated with a different Makazi account.");
        }
        return { tenant: this.sanitize(existing), tenantCode: existing.tenantCodeClaimedAt ? null : existing.tenantCode, reused: true };
      }
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

    return { tenant: this.sanitize(user), tenantCode, reused: false };
  }

  /**
   * Registers many tenants in one pass (CSV import) by replaying registerTenant
   * per row — same validation, same reuse-by-email rule, one row's failure
   * doesn't stop the rest. Deliberately registration-only: assigning a tenant
   * to a unit involves rent/deposit terms a bulk operation shouldn't guess at,
   * so that stays a one-by-one action on the unit itself.
   */
  async bulkRegister(actorId: string, dto: BulkRegisterTenantsDto) {
    const results: { row: number; name: string; status: "created" | "reused" | "error"; message: string }[] = [];

    for (let i = 0; i < dto.rows.length; i++) {
      const row = dto.rows[i];
      const name = `${row.firstName} ${row.lastName}`;
      try {
        const result = await this.registerTenant(actorId, row);
        results.push({
          row: i + 1,
          name,
          status: result.reused ? "reused" : "created",
          message: result.reused ? "Already existed — linked the existing tenant profile." : "Registered.",
        });
      } catch (err) {
        const message =
          err instanceof HttpException
            ? (() => {
                const body = err.getResponse();
                const m = typeof body === "object" && body !== null ? (body as { message?: unknown }).message : body;
                return Array.isArray(m) ? m.join(", ") : String(m ?? err.message);
              })()
            : "Failed to register.";
        results.push({ row: i + 1, name, status: "error", message });
      }
    }

    return {
      results,
      created: results.filter((r) => r.status === "created").length,
      reused: results.filter((r) => r.status === "reused").length,
      failed: results.filter((r) => r.status === "error").length,
    };
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
        where: { tenantId: tenant.id, unit: { propertyId: { in: await this.access.accessiblePropertyIds(actor) } } },
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
          where: { status: { in: [TenancyStatus.PENDING, TenancyStatus.ACTIVE] } },
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
        where: { tenantId: tenant.id, unit: { propertyId: { in: await this.access.accessiblePropertyIds(actor) } } },
      }));
    if (!authorized) throw new NotFoundException("Tenant not found");

    await this.prisma.$transaction(async (tx) => {
      const heldUnits = await tx.tenancy.findMany({
        where: { tenantId: tenant.id, status: { in: [TenancyStatus.PENDING, TenancyStatus.ACTIVE] } },
      });
      for (const tenancy of heldUnits) {
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
        where: { tenantId: tenant.id, unit: { propertyId: { in: await this.access.accessiblePropertyIds(actor) } } },
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
      where: { tenantId, status: { in: [TenancyStatus.PENDING, TenancyStatus.ACTIVE] } },
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

  // ---------- Tenant-facing tenancy actions (accept/decline a pending invite, request to leave) ----------

  /** Every tenancy this tenant holds — powers their dashboard, including the limited-access state (no ACTIVE row) and pending-invite banner. */
  async listMyTenancies(tenantId: string) {
    const tenancies = await this.prisma.tenancy.findMany({
      where: { tenantId },
      include: {
        unit: { include: { property: { include: { landlord: { select: { firstName: true, lastName: true } } } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return tenancies.map((t) => ({
      id: t.id,
      status: t.status,
      rentAmount: t.rentAmount.toString(),
      leaseStart: t.leaseStart,
      leaseEnd: t.leaseEnd,
      exitRequestedAt: t.exitRequestedAt,
      unit: { id: t.unit.id, code: t.unit.code },
      property: { id: t.unit.property.id, name: t.unit.property.name },
      landlordName: `${t.unit.property.landlord.firstName} ${t.unit.property.landlord.lastName}`,
    }));
  }

  /** Tenant accepts a PENDING tenancy from a landlord new to them — activates it and occupies the unit. */
  async acceptTenancy(tenantId: string, tenancyId: string) {
    const tenancy = await this.prisma.tenancy.findFirst({
      where: { id: tenancyId, tenantId },
      include: { tenant: true, unit: { include: { property: true } } },
    });
    if (!tenancy) throw new NotFoundException("Invitation not found");
    if (tenancy.status !== TenancyStatus.PENDING) throw new BadRequestException("This invitation is no longer pending.");

    await this.prisma.$transaction(async (tx) => {
      await tx.tenancy.update({ where: { id: tenancyId }, data: { status: TenancyStatus.ACTIVE } });
      await tx.unit.update({ where: { id: tenancy.unitId }, data: { status: UnitStatus.OCCUPIED } });
    });

    await this.notifications.create(
      tenancy.unit.property.landlordId,
      NotificationType.TENANCY_ACCEPTED,
      `${tenancy.tenant.firstName} ${tenancy.tenant.lastName} accepted the tenancy for ${tenancy.unit.property.name}, unit ${tenancy.unit.code}`,
    );
    return { status: TenancyStatus.ACTIVE };
  }

  /** Tenant declines a PENDING tenancy — removes it and frees the unit back to vacant. */
  async declineTenancy(tenantId: string, tenancyId: string) {
    const tenancy = await this.prisma.tenancy.findFirst({
      where: { id: tenancyId, tenantId },
      include: { tenant: true, unit: { include: { property: true } } },
    });
    if (!tenancy) throw new NotFoundException("Invitation not found");
    if (tenancy.status !== TenancyStatus.PENDING) throw new BadRequestException("This invitation is no longer pending.");

    await this.prisma.$transaction(async (tx) => {
      await tx.tenancy.delete({ where: { id: tenancyId } });
      await tx.unit.update({ where: { id: tenancy.unitId }, data: { status: UnitStatus.VACANT } });
    });

    await this.notifications.create(
      tenancy.unit.property.landlordId,
      NotificationType.GENERAL,
      `${tenancy.tenant.firstName} ${tenancy.tenant.lastName} declined the tenancy for ${tenancy.unit.property.name}, unit ${tenancy.unit.code}`,
    );
    return { declined: true };
  }

  /** Tenant asks to end an ACTIVE tenancy — flags it and notifies the landlord + any caretaker, who finalise it via move-out. */
  async requestExit(tenantId: string, tenancyId: string, dto: RequestExitDto) {
    const tenancy = await this.prisma.tenancy.findFirst({
      where: { id: tenancyId, tenantId, status: TenancyStatus.ACTIVE },
      include: { tenant: true, unit: { include: { property: true } } },
    });
    if (!tenancy) throw new NotFoundException("Active tenancy not found");
    if (tenancy.exitRequestedAt) throw new BadRequestException("You've already requested to leave this unit.");

    await this.prisma.tenancy.update({
      where: { id: tenancyId },
      data: { exitRequestedAt: new Date(), exitReason: dto.reason },
    });

    const caretakers = await this.prisma.caretakerAssignment.findMany({
      where: { propertyId: tenancy.unit.propertyId, inviteStatus: CaretakerInviteStatus.ACCEPTED },
      select: { caretakerId: true },
    });
    const recipientIds = [tenancy.unit.property.landlordId, ...caretakers.map((c) => c.caretakerId)];
    const title = `${tenancy.tenant.firstName} ${tenancy.tenant.lastName} asked to leave ${tenancy.unit.property.name}, unit ${tenancy.unit.code}`;
    for (const recipientId of recipientIds) {
      await this.notifications.create(recipientId, NotificationType.TENANT_EXIT_REQUEST, title, dto.reason, {
        tenancyId: tenancy.id,
        unitId: tenancy.unitId,
      });
    }
    return { requested: true };
  }

  /** Landlord/caretaker view of tenants who've asked to leave — each links to the unit's move-out flow to finalise. */
  async listExitRequests(actor: ActingUser) {
    const propertyIds = await this.access.accessiblePropertyIds(actor);
    if (propertyIds.length === 0) return [];
    const tenancies = await this.prisma.tenancy.findMany({
      where: { status: TenancyStatus.ACTIVE, exitRequestedAt: { not: null }, unit: { propertyId: { in: propertyIds } } },
      include: {
        tenant: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
        unit: { include: { property: { select: { id: true, name: true } } } },
      },
      orderBy: { exitRequestedAt: "asc" },
    });
    return tenancies.map((t) => ({
      tenancyId: t.id,
      unitId: t.unitId,
      unitCode: t.unit.code,
      property: t.unit.property,
      tenant: t.tenant,
      exitRequestedAt: t.exitRequestedAt,
      exitReason: t.exitReason,
    }));
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
