import { ConflictException, Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InspectionType, UnitStatus, UserRole } from "@makazi/shared-types";
import { Prisma } from "../../../generated/prisma";
import { PrismaService } from "../../prisma/prisma.service";
import { STORAGE_GATEWAY, type StorageGateway } from "../../integrations/storage/storage-gateway.types";
import { PropertyAccessService, type ActingUser } from "../../common/services/property-access.service";
import { InvitationEmailService } from "../invitations/invitation-email.service";
import { CreateUnitDto } from "./dto/create-unit.dto";
import { UpdateUnitDto } from "./dto/update-unit.dto";
import { QueryUnitsDto } from "./dto/query-units.dto";
import { BulkGenerateUnitsAutoDto } from "./dto/bulk-generate-units-auto.dto";
import { BulkGenerateUnitsManualDto } from "./dto/bulk-generate-units-manual.dto";
import { AssignTenantDto } from "./dto/assign-tenant.dto";
import { MoveOutInspectDto } from "./dto/move-out-inspect.dto";
import { MoveOutDamageDto } from "./dto/move-out-damage.dto";
import { MoveOutDepositDto } from "./dto/move-out-deposit.dto";

const UNIT_ORDER: Prisma.UnitOrderByWithRelationInput[] = [{ floor: "asc" }, { code: "asc" }];
const ACTIVE_TENANCY_INCLUDE = {
  tenancies: {
    where: { active: true },
    include: { tenant: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } } },
  },
} satisfies Prisma.UnitInclude;
const MOVE_OUT_STEPS = ["confirm", "inspect", "damage_assessment", "deposit_reconciliation", "report", "vacant"] as const;
type MoveOutStep = (typeof MOVE_OUT_STEPS)[number];

@Injectable()
export class UnitsService {
  private readonly logger = new Logger(UnitsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_GATEWAY) private readonly s3: StorageGateway,
    private readonly access: PropertyAccessService,
    private readonly invitationEmail: InvitationEmailService,
  ) {}

  async findAllForProperty(user: ActingUser, propertyId: string, query: QueryUnitsDto) {
    await this.access.assertAccess(user, propertyId);
    return this.prisma.unit.findMany({
      where: {
        propertyId,
        ...(query.status ? { status: query.status } : {}),
        ...(query.floor !== undefined ? { floor: query.floor } : {}),
      },
      orderBy: UNIT_ORDER,
      include: ACTIVE_TENANCY_INCLUDE,
    });
  }

  async create(user: ActingUser, propertyId: string, dto: CreateUnitDto) {
    await this.access.assertAccess(user, propertyId);
    try {
      return await this.prisma.unit.create({ data: { propertyId, ...dto } });
    } catch (e) {
      throw this.mapUniqueCodeError(e, dto.code);
    }
  }

  async bulkGenerateAuto(user: ActingUser, propertyId: string, dto: BulkGenerateUnitsAutoDto) {
    await this.access.assertAccess(user, propertyId);

    const existing = await this.prisma.unit.findMany({ where: { propertyId }, select: { code: true } });
    const existingCodes = new Set(existing.map((u) => u.code));

    const unitsPerFloor = Math.ceil(dto.totalUnits / dto.floors);
    const toCreate: Prisma.UnitCreateManyInput[] = [];
    let created = 0;
    for (let floor = 1; floor <= dto.floors && created < dto.totalUnits; floor++) {
      for (let seq = 1; seq <= unitsPerFloor && created < dto.totalUnits; seq++) {
        const code = `${floor}-${String(seq).padStart(2, "0")}`;
        if (existingCodes.has(code)) continue;
        toCreate.push({ propertyId, code, floor, rentAmount: dto.defaultRentAmount });
        created++;
      }
    }

    await this.prisma.unit.createMany({ data: toCreate });
    return this.prisma.unit.findMany({ where: { propertyId }, orderBy: UNIT_ORDER });
  }

  async bulkGenerateManual(user: ActingUser, propertyId: string, dto: BulkGenerateUnitsManualDto) {
    await this.access.assertAccess(user, propertyId);
    try {
      await this.prisma.unit.createMany({
        data: dto.units.map((u) => ({ propertyId, ...u })),
      });
    } catch (e) {
      throw this.mapUniqueCodeError(e);
    }
    return this.prisma.unit.findMany({ where: { propertyId }, orderBy: UNIT_ORDER });
  }

  async update(user: ActingUser, unitId: string, dto: UpdateUnitDto) {
    const unit = await this.access.assertUnitAccess(user, unitId);
    try {
      return await this.prisma.unit.update({ where: { id: unit.id }, data: dto });
    } catch (e) {
      throw this.mapUniqueCodeError(e, dto.code);
    }
  }

  async remove(user: ActingUser, unitId: string) {
    const unit = await this.access.assertUnitAccess(user, unitId);
    const activeTenancy = await this.prisma.tenancy.findFirst({ where: { unitId: unit.id, active: true } });
    if (activeTenancy) {
      throw new ConflictException("Cannot delete a unit with an active tenancy");
    }
    await this.prisma.unit.delete({ where: { id: unit.id } });
    return { message: "Unit deleted" };
  }

  // ---------- Assign Tenant (register-then-assign: see TenantsService.registerTenant for step 1) ----------

  async assignTenant(user: ActingUser, unitId: string, dto: AssignTenantDto) {
    const unit = await this.access.assertUnitAccess(user, unitId);

    const existingActive = await this.prisma.tenancy.findFirst({ where: { unitId: unit.id, active: true } });
    if (existingActive) throw new ConflictException("This unit already has an active tenant");

    const tenant = await this.prisma.user.findUnique({ where: { id: dto.existingTenantId } });
    if (!tenant || tenant.role !== UserRole.TENANT) throw new NotFoundException("Tenant not found");

    // The destination unit's access was already checked above, but that says
    // nothing about whether THIS tenant is actually within the caller's
    // scope — without this, any caretaker/landlord could reassign a
    // completely unrelated tenant (e.g. one only visible to them because
    // they separately manage a different landlord's property) into their
    // own unit. Same scoping rule as TenantsService.resendInvite.
    const tenantAuthorized =
      tenant.registeredById === user.id ||
      (await this.prisma.tenancy.findFirst({
        where: { tenantId: tenant.id, active: true, unit: { propertyId: { in: await this.access.accessiblePropertyIds(user) } } },
      }));
    if (!tenantAuthorized) throw new NotFoundException("Tenant not found");

    const tenantHasOtherActiveTenancy = await this.prisma.tenancy.findFirst({ where: { tenantId: tenant.id, active: true } });
    if (tenantHasOtherActiveTenancy) throw new ConflictException("This tenant already has an active tenancy elsewhere");

    const tenancy = await this.prisma.$transaction(async (tx) => {
      const created = await tx.tenancy.create({
        data: {
          unitId: unit.id,
          tenantId: tenant.id,
          leaseStart: new Date(dto.leaseStart),
          leaseEnd: dto.leaseEnd ? new Date(dto.leaseEnd) : undefined,
          rentAmount: dto.rentAmount,
          depositAmount: dto.depositAmount,
        },
        include: { tenant: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } } },
      });
      await tx.unit.update({ where: { id: unit.id }, data: { status: UnitStatus.OCCUPIED } });
      return created;
    });

    // Now that a unit/rent context exists, (re-)send the invite with it —
    // handles both "register then assign later" and "assign right away".
    // Best-effort: an SMTP hiccup must never fail an already-committed assignment.
    if (tenant.email && !tenant.tenantCodeClaimedAt) {
      const property = await this.prisma.property.findUnique({ where: { id: unit.propertyId }, select: { name: true } });
      this.invitationEmail
        .sendTenantInvite(
          tenant.email,
          tenant.firstName,
          { propertyName: property?.name ?? "", unitCode: unit.code, rentAmount: dto.rentAmount.toString() },
          tenant.tenantCode!,
        )
        .then(() => this.prisma.user.update({ where: { id: tenant.id }, data: { tenantCodeInvitedAt: new Date() } }))
        .catch((err) => this.logger.error(`Failed to send tenant invite email to ${tenant.email}: ${err}`));
    }

    // Surface the tenant's code again in case whoever is assigning them isn't
    // the same person who registered them and never saw it — null once claimed.
    return { tenancy, tenantCode: tenant.tenantCodeClaimedAt ? null : tenant.tenantCode };
  }

  // ---------- Move-Out Wizard (Confirm -> Inspect -> Damage Assessment -> Deposit Reconciliation -> Report -> Vacant) ----------

  async startMoveOut(user: ActingUser, unitId: string) {
    const unit = await this.access.assertUnitAccess(user, unitId);
    const tenancy = await this.getActiveTenancyOrThrow(unit.id);

    const existing = await this.prisma.moveOut.findUnique({ where: { tenancyId: tenancy.id } });
    if (existing) return existing;

    return this.prisma.moveOut.create({ data: { tenancyId: tenancy.id, step: "confirm" } });
  }

  async getMoveOut(user: ActingUser, unitId: string) {
    const unit = await this.access.assertUnitAccess(user, unitId);
    const tenancy = await this.getActiveTenancyOrThrow(unit.id);
    const moveOut = await this.prisma.moveOut.findUnique({ where: { tenancyId: tenancy.id } });
    if (!moveOut) throw new NotFoundException("No move-out in progress for this unit");
    return moveOut;
  }

  async confirmMoveOut(user: ActingUser, unitId: string) {
    const unit = await this.access.assertUnitAccess(user, unitId);
    const moveOut = await this.getMoveOutAtStep(unit.id, "confirm");
    return this.prisma.moveOut.update({ where: { id: moveOut.id }, data: { step: "inspect" } });
  }

  async presignInspectionPhoto(user: ActingUser, unitId: string, contentType: string) {
    const unit = await this.access.assertUnitAccess(user, unitId);
    return this.s3.createPresignedUploadUrl(`inspections/${unit.id}`, contentType);
  }

  async moveOutInspect(user: ActingUser, unitId: string, dto: MoveOutInspectDto) {
    const unit = await this.access.assertUnitAccess(user, unitId);
    const moveOut = await this.getMoveOutAtStep(unit.id, "inspect");

    await this.prisma.inspection.create({
      data: {
        unitId: unit.id,
        type: InspectionType.MOVE_OUT,
        checklist: dto.checklist ?? {},
        photoUrls: dto.photoUrls ?? [],
      },
    });

    return this.prisma.moveOut.update({ where: { id: moveOut.id }, data: { step: "damage_assessment" } });
  }

  async moveOutDamageAssessment(user: ActingUser, unitId: string, dto: MoveOutDamageDto) {
    const unit = await this.access.assertUnitAccess(user, unitId);
    const moveOut = await this.getMoveOutAtStep(unit.id, "damage_assessment");
    return this.prisma.moveOut.update({
      where: { id: moveOut.id },
      data: { damageNotes: dto.damageNotes, step: "deposit_reconciliation" },
    });
  }

  async moveOutDepositReconciliation(user: ActingUser, unitId: string, dto: MoveOutDepositDto) {
    const unit = await this.access.assertUnitAccess(user, unitId);
    const moveOut = await this.getMoveOutAtStep(unit.id, "deposit_reconciliation");
    return this.prisma.moveOut.update({
      where: { id: moveOut.id },
      data: { depositDeductions: dto.depositDeductions, step: "report" },
    });
  }

  async moveOutGenerateReport(user: ActingUser, unitId: string) {
    const unit = await this.access.assertUnitAccess(user, unitId);
    const moveOut = await this.getMoveOutAtStep(unit.id, "report");

    const tenancy = await this.prisma.tenancy.findUniqueOrThrow({
      where: { id: moveOut.tenancyId },
      include: { tenant: true, unit: { include: { property: true } } },
    });
    const inspection = await this.prisma.inspection.findFirst({
      where: { unitId: unit.id, type: InspectionType.MOVE_OUT },
      orderBy: { submittedAt: "desc" },
    });

    const deposit = tenancy.depositAmount ? Number(tenancy.depositAmount) : 0;
    const deductions = moveOut.depositDeductions ? Number(moveOut.depositDeductions) : 0;
    const refund = Math.max(0, deposit - deductions);

    const html = this.renderMoveOutReportHtml({
      tenantName: `${tenancy.tenant.firstName} ${tenancy.tenant.lastName}`,
      propertyName: tenancy.unit.property.name,
      unitCode: tenancy.unit.code,
      leaseStart: tenancy.leaseStart,
      moveOutDate: new Date(),
      deposit,
      deductions,
      refund,
      damageNotes: moveOut.damageNotes,
      inspectionChecklist: (inspection?.checklist as Record<string, string> | undefined) ?? {},
    });
    const reportUrl = await this.s3.putObject(`move-out-reports/${moveOut.id}`, html, "text/html");

    return this.prisma.moveOut.update({ where: { id: moveOut.id }, data: { reportUrl } });
  }

  async completeMoveOut(user: ActingUser, unitId: string) {
    const unit = await this.access.assertUnitAccess(user, unitId);
    const moveOut = await this.getMoveOutAtStep(unit.id, "report");
    if (!moveOut.reportUrl) throw new ConflictException("Generate the move-out report before completing");

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.moveOut.update({
        where: { id: moveOut.id },
        data: { step: "vacant", completedAt: new Date() },
      });
      await tx.tenancy.update({ where: { id: moveOut.tenancyId }, data: { active: false } });
      await tx.unit.update({ where: { id: unit.id }, data: { status: UnitStatus.VACANT } });
      return updated;
    });
  }

  private async getActiveTenancyOrThrow(unitId: string) {
    const tenancy = await this.prisma.tenancy.findFirst({ where: { unitId, active: true } });
    if (!tenancy) throw new NotFoundException("This unit has no active tenancy");
    return tenancy;
  }

  private async getMoveOutAtStep(unitId: string, expectedStep: MoveOutStep) {
    const tenancy = await this.getActiveTenancyOrThrow(unitId);
    const moveOut = await this.prisma.moveOut.findUnique({ where: { tenancyId: tenancy.id } });
    if (!moveOut) throw new NotFoundException("No move-out in progress for this unit");
    if (moveOut.step !== expectedStep) {
      throw new ConflictException(`This move-out is at the "${moveOut.step}" step, not "${expectedStep}"`);
    }
    return moveOut;
  }

  private renderMoveOutReportHtml(data: {
    tenantName: string;
    propertyName: string;
    unitCode: string;
    leaseStart: Date;
    moveOutDate: Date;
    deposit: number;
    deductions: number;
    refund: number;
    damageNotes: string | null;
    inspectionChecklist: Record<string, string>;
  }): string {
    const fmtKES = (n: number) => `KES ${n.toLocaleString("en-KE")}`;
    const fmtDate = (d: Date) => d.toISOString().slice(0, 10);
    const checklistRows = Object.entries(data.inspectionChecklist)
      .map(([item, state]) => `<tr><td>${item}</td><td>${state}</td></tr>`)
      .join("");

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Move-Out Report — ${data.unitCode}</title>
<style>body{font-family:sans-serif;max-width:640px;margin:40px auto;color:#0B140F}
h1{font-size:22px}h2{font-size:15px;color:#5C665F;text-transform:uppercase;margin-top:28px}
table{width:100%;border-collapse:collapse;margin-top:8px}
td{padding:8px;border-bottom:1px solid #E4E2DA}
.total{font-weight:700}</style></head>
<body>
<h1>Move-Out Report</h1>
<p>${data.propertyName} — Unit ${data.unitCode}</p>
<h2>Tenancy</h2>
<table>
<tr><td>Tenant</td><td>${data.tenantName}</td></tr>
<tr><td>Lease started</td><td>${fmtDate(data.leaseStart)}</td></tr>
<tr><td>Move-out date</td><td>${fmtDate(data.moveOutDate)}</td></tr>
</table>
<h2>Inspection checklist</h2>
<table>${checklistRows || "<tr><td colspan=2>No checklist recorded.</td></tr>"}</table>
<h2>Damage notes</h2>
<p>${data.damageNotes ?? "None recorded."}</p>
<h2>Deposit reconciliation</h2>
<table>
<tr><td>Deposit held</td><td>${fmtKES(data.deposit)}</td></tr>
<tr><td>Deductions</td><td>${fmtKES(data.deductions)}</td></tr>
<tr class="total"><td>Refund due</td><td>${fmtKES(data.refund)}</td></tr>
</table>
</body></html>`;
  }

  private mapUniqueCodeError(e: unknown, code?: string): Error {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return new ConflictException(
        code ? `Unit code "${code}" already exists in this property` : "One or more unit codes already exist in this property",
      );
    }
    return e instanceof Error ? e : new Error(String(e));
  }
}
