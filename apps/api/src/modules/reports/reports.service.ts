import { Inject, Injectable } from "@nestjs/common";
import { MaintenanceStatus, PaymentStatus, UnitStatus, UserRole } from "@makazi/shared-types";
import { PrismaService } from "../../prisma/prisma.service";
import { PropertyAccessService, type ActingUser } from "../../common/services/property-access.service";
import { STORAGE_GATEWAY, type StorageGateway } from "../../integrations/storage/storage-gateway.types";
import type { ReportExportType } from "./dto/export-csv-query.dto";

interface MonthBucket {
  label: string;
  start: Date;
  end: Date;
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: PropertyAccessService,
    @Inject(STORAGE_GATEWAY) private readonly s3: StorageGateway,
  ) {}

  /** Live snapshot for the Landlord dashboard home — deliberately separate from the month-trend reports above (no bucket history, just "right now" + a handful of recents), so it stays cheap on every dashboard load. */
  async getDashboardSummary(user: ActingUser) {
    const propertyIds = await this.access.accessiblePropertyIds(user);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [properties, units, tenants, recentPaymentRows, recentTicketRows, monthRevenue, lateRows] = await Promise.all([
      this.prisma.property.findMany({
        where: { id: { in: propertyIds } },
        select: { id: true, name: true, location: true, county: true },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.unit.findMany({
        where: { propertyId: { in: propertyIds } },
        select: { propertyId: true, status: true },
      }),
      // Same scope as TenantsService.findMany: assigned to an accessible
      // property, or registered by this landlord but not yet assigned.
      this.prisma.user.findMany({
        where: {
          role: UserRole.TENANT,
          OR: [
            { tenancies: { some: { unit: { propertyId: { in: propertyIds } } } } },
            { registeredById: user.id, tenancies: { none: {} } },
          ],
        },
        select: { createdAt: true },
      }),
      this.prisma.payment.findMany({
        where: { tenancy: { unit: { propertyId: { in: propertyIds } } } },
        orderBy: { createdAt: "desc" },
        take: 4,
        include: {
          tenancy: {
            select: { tenant: { select: { firstName: true, lastName: true } }, unit: { select: { code: true } } },
          },
        },
      }),
      this.prisma.maintenanceTicket.findMany({
        where: { unit: { propertyId: { in: propertyIds } } },
        orderBy: { createdAt: "desc" },
        take: 4,
        include: {
          reportedBy: { select: { firstName: true, lastName: true } },
          unit: { select: { code: true } },
        },
      }),
      this.prisma.payment.aggregate({
        where: {
          tenancy: { unit: { propertyId: { in: propertyIds } } },
          status: PaymentStatus.PAID,
          paidAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      }),
      this.prisma.payment.findMany({
        where: { tenancy: { unit: { propertyId: { in: propertyIds } } }, status: PaymentStatus.LATE },
        select: { amount: true, tenancyId: true },
      }),
    ]);

    const totalUnits = units.length;
    const occupied = units.filter((u) => u.status === UnitStatus.OCCUPIED).length;
    const vacant = units.filter((u) => u.status === UnitStatus.VACANT).length;
    const reserved = units.filter((u) => u.status === UnitStatus.RESERVED).length;
    const underMaintenance = units.filter((u) => u.status === UnitStatus.UNDER_MAINTENANCE).length;

    const unitsByProperty = new Map<string, { total: number; occupied: number; vacant: number }>();
    for (const u of units) {
      const row = unitsByProperty.get(u.propertyId) ?? { total: 0, occupied: 0, vacant: 0 };
      row.total += 1;
      if (u.status === UnitStatus.OCCUPIED) row.occupied += 1;
      if (u.status === UnitStatus.VACANT) row.vacant += 1;
      unitsByProperty.set(u.propertyId, row);
    }

    const tenantsNewThisMonth = tenants.filter((t) => t.createdAt >= monthStart && t.createdAt <= monthEnd).length;
    const countiesCount = new Set(properties.map((p) => p.county).filter((c): c is string => Boolean(c))).size;
    const overdueTenancyIds = new Set(lateRows.map((p) => p.tenancyId));
    const outstandingRentKES = lateRows.reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      stats: {
        revenueKES: Number(monthRevenue._sum.amount ?? 0),
        revenueSub: "This month",
        occupancyPct: totalUnits > 0 ? Math.round((occupied / totalUnits) * 100) : 0,
        occupancySub: `${occupied} of ${totalUnits} units`,
        propertiesCount: properties.length,
        propertiesSub: countiesCount > 0 ? `Across ${countiesCount} count${countiesCount === 1 ? "y" : "ies"}` : "No county set yet",
        tenantsCount: tenants.length,
        tenantsSub: `${tenantsNewThisMonth} new this month`,
        vacantUnits: vacant,
        vacantSub: "Across all properties",
        outstandingRentKES,
        outstandingSub: `${overdueTenancyIds.size} tenant${overdueTenancyIds.size === 1 ? "" : "s"} overdue`,
      },
      properties: properties.slice(0, 5).map((p) => {
        const row = unitsByProperty.get(p.id) ?? { total: 0, occupied: 0, vacant: 0 };
        return {
          id: p.id,
          name: p.name,
          location: p.location,
          totalUnits: row.total,
          occupiedUnits: row.occupied,
          vacantUnits: row.total - row.occupied,
        };
      }),
      occupancyBreakdown: [
        { status: UnitStatus.OCCUPIED, count: occupied },
        { status: UnitStatus.VACANT, count: vacant },
        { status: UnitStatus.RESERVED, count: reserved },
        { status: UnitStatus.UNDER_MAINTENANCE, count: underMaintenance },
      ],
      recentPayments: recentPaymentRows.map((p) => ({
        id: p.id,
        tenantName: `${p.tenancy.tenant.firstName} ${p.tenancy.tenant.lastName}`,
        unit: p.tenancy.unit.code,
        amountKES: Number(p.amount),
        status: p.status,
      })),
      recentMaintenance: recentTicketRows.map((t) => ({
        id: t.id,
        reportedByName: `${t.reportedBy.firstName} ${t.reportedBy.lastName}`,
        unit: t.unit.code,
        issue: t.issue,
        status: t.status,
      })),
    };
  }

  async getOccupancyReport(user: ActingUser, propertyId: string | undefined, months: number) {
    const propertyIds = await this.resolvePropertyIds(user, propertyId);
    const buckets = this.monthBuckets(months);

    const units = await this.prisma.unit.findMany({
      where: { propertyId: { in: propertyIds } },
      select: { id: true, propertyId: true, status: true, createdAt: true, property: { select: { id: true, name: true } } },
    });
    const tenancies = await this.prisma.tenancy.findMany({
      where: { unit: { propertyId: { in: propertyIds } } },
      select: { unitId: true, leaseStart: true, leaseEnd: true },
    });

    const trend = buckets.map((bucket) => {
      const unitsByThen = units.filter((u) => u.createdAt <= bucket.end);
      const occupiedUnitIds = new Set(
        tenancies
          .filter((t) => t.leaseStart <= bucket.end && (!t.leaseEnd || t.leaseEnd >= bucket.start))
          .map((t) => t.unitId),
      );
      const occupied = unitsByThen.filter((u) => occupiedUnitIds.has(u.id)).length;
      return {
        month: bucket.label,
        totalUnits: unitsByThen.length,
        occupiedUnits: occupied,
        occupancyRate: unitsByThen.length > 0 ? occupied / unitsByThen.length : 0,
      };
    });

    const current = {
      total: units.length,
      occupied: units.filter((u) => u.status === UnitStatus.OCCUPIED).length,
      vacant: units.filter((u) => u.status === UnitStatus.VACANT).length,
      reserved: units.filter((u) => u.status === UnitStatus.RESERVED).length,
      underMaintenance: units.filter((u) => u.status === UnitStatus.UNDER_MAINTENANCE).length,
    };

    const byProperty = new Map<string, { propertyId: string; propertyName: string; total: number; occupied: number; vacant: number }>();
    for (const u of units) {
      const row = byProperty.get(u.propertyId) ?? { propertyId: u.propertyId, propertyName: u.property.name, total: 0, occupied: 0, vacant: 0 };
      row.total += 1;
      if (u.status === UnitStatus.OCCUPIED) row.occupied += 1;
      if (u.status === UnitStatus.VACANT) row.vacant += 1;
      byProperty.set(u.propertyId, row);
    }

    return {
      current,
      occupancyRate: current.total > 0 ? current.occupied / current.total : 0,
      trend,
      byProperty: [...byProperty.values()],
    };
  }

  async getIncomeReport(user: ActingUser, propertyId: string | undefined, months: number) {
    const propertyIds = await this.resolvePropertyIds(user, propertyId);
    const buckets = this.monthBuckets(months);

    const payments = await this.prisma.payment.findMany({
      where: { tenancy: { unit: { propertyId: { in: propertyIds } } }, dueDate: { gte: buckets[0].start, lte: buckets[buckets.length - 1].end } },
      select: {
        amount: true,
        status: true,
        dueDate: true,
        tenancy: { select: { unit: { select: { propertyId: true, property: { select: { id: true, name: true } } } } } },
      },
    });

    const trend = buckets.map((bucket) => {
      const inBucket = payments.filter((p) => p.dueDate && p.dueDate >= bucket.start && p.dueDate <= bucket.end);
      const expected = inBucket.reduce((sum, p) => sum + Number(p.amount), 0);
      const collected = inBucket.filter((p) => p.status === PaymentStatus.PAID).reduce((sum, p) => sum + Number(p.amount), 0);
      return { month: bucket.label, expected, collected, collectionRate: expected > 0 ? collected / expected : 0 };
    });

    const totalExpected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalCollected = payments.filter((p) => p.status === PaymentStatus.PAID).reduce((sum, p) => sum + Number(p.amount), 0);

    const byProperty = new Map<string, { propertyId: string; propertyName: string; expected: number; collected: number }>();
    for (const p of payments) {
      const propId = p.tenancy.unit.propertyId;
      const row = byProperty.get(propId) ?? { propertyId: propId, propertyName: p.tenancy.unit.property.name, expected: 0, collected: 0 };
      row.expected += Number(p.amount);
      if (p.status === PaymentStatus.PAID) row.collected += Number(p.amount);
      byProperty.set(propId, row);
    }

    return {
      totalExpected,
      totalCollected,
      collectionRate: totalExpected > 0 ? totalCollected / totalExpected : 0,
      trend,
      byProperty: [...byProperty.values()],
    };
  }

  async getVacancyReport(user: ActingUser, propertyId: string | undefined) {
    const propertyIds = await this.resolvePropertyIds(user, propertyId);

    const vacantUnits = await this.prisma.unit.findMany({
      where: { propertyId: { in: propertyIds }, status: UnitStatus.VACANT },
      include: {
        property: { select: { id: true, name: true } },
        tenancies: { orderBy: { updatedAt: "desc" }, take: 1, select: { updatedAt: true } },
      },
    });
    const totalUnits = await this.prisma.unit.count({ where: { propertyId: { in: propertyIds } } });

    const now = Date.now();
    const units = vacantUnits
      .map((u) => {
        // No prior tenancy at all -> never occupied, vacant since creation.
        // Otherwise, the most recent tenancy's updatedAt is when it was set
        // inactive (leaseEnd is only ever an upfront expectation, not
        // reliably set on an actual move-out — see UnitsService).
        const vacantSince = u.tenancies[0]?.updatedAt ?? u.createdAt;
        const daysVacant = Math.floor((now - vacantSince.getTime()) / 86_400_000);
        return {
          unitId: u.id,
          unitCode: u.code,
          propertyId: u.property.id,
          propertyName: u.property.name,
          vacantSince,
          daysVacant,
        };
      })
      .sort((a, b) => b.daysVacant - a.daysVacant);

    return {
      totalVacant: units.length,
      totalUnits,
      vacancyRate: totalUnits > 0 ? units.length / totalUnits : 0,
      units,
    };
  }

  async getPaymentsReport(user: ActingUser, propertyId: string | undefined, months: number) {
    const propertyIds = await this.resolvePropertyIds(user, propertyId);
    const buckets = this.monthBuckets(months);

    const payments = await this.prisma.payment.findMany({
      where: { tenancy: { unit: { propertyId: { in: propertyIds } } }, dueDate: { gte: buckets[0].start, lte: buckets[buckets.length - 1].end } },
      include: {
        tenancy: {
          select: {
            tenant: { select: { id: true, firstName: true, lastName: true } },
            unit: { select: { id: true, code: true, property: { select: { id: true, name: true } } } },
          },
        },
      },
      orderBy: { dueDate: "desc" },
    });

    const byStatus = {
      pending: payments.filter((p) => p.status === PaymentStatus.PENDING).length,
      late: payments.filter((p) => p.status === PaymentStatus.LATE).length,
      paid: payments.filter((p) => p.status === PaymentStatus.PAID).length,
      failed: payments.filter((p) => p.status === PaymentStatus.FAILED).length,
    };

    const now = Date.now();
    const overdue = payments
      .filter((p) => p.status === PaymentStatus.LATE)
      .map((p) => ({
        paymentId: p.id,
        tenantName: `${p.tenancy.tenant.firstName} ${p.tenancy.tenant.lastName}`,
        unitCode: p.tenancy.unit.code,
        propertyName: p.tenancy.unit.property.name,
        amount: Number(p.amount),
        dueDate: p.dueDate,
        daysOverdue: p.dueDate ? Math.floor((now - p.dueDate.getTime()) / 86_400_000) : 0,
      }))
      .sort((a, b) => b.daysOverdue - a.daysOverdue);

    return { totalPayments: payments.length, byStatus, overdue };
  }

  async getMaintenanceReport(user: ActingUser, propertyId: string | undefined, months: number) {
    const propertyIds = await this.resolvePropertyIds(user, propertyId);
    const buckets = this.monthBuckets(months);

    const tickets = await this.prisma.maintenanceTicket.findMany({
      where: { unit: { propertyId: { in: propertyIds } }, createdAt: { gte: buckets[0].start, lte: buckets[buckets.length - 1].end } },
      select: { status: true, category: true, priority: true, createdAt: true, resolvedAt: true },
    });

    const byStatus: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    for (const t of tickets) {
      byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
      const category = t.category ?? "UNCATEGORIZED";
      byCategory[category] = (byCategory[category] ?? 0) + 1;
      byPriority[t.priority] = (byPriority[t.priority] ?? 0) + 1;
    }

    const resolved = tickets.filter((t) => t.resolvedAt);
    const avgResolutionHours =
      resolved.length > 0
        ? resolved.reduce((sum, t) => sum + (t.resolvedAt!.getTime() - t.createdAt.getTime()), 0) / resolved.length / 3_600_000
        : null;

    const trend = buckets.map((bucket) => ({
      month: bucket.label,
      created: tickets.filter((t) => t.createdAt >= bucket.start && t.createdAt <= bucket.end).length,
      resolved: tickets.filter((t) => t.resolvedAt && t.resolvedAt >= bucket.start && t.resolvedAt <= bucket.end).length,
    }));

    const openCount = tickets.filter((t) => t.status !== MaintenanceStatus.COMPLETED && t.status !== MaintenanceStatus.CLOSED).length;

    return { totalTickets: tickets.length, openCount, byStatus, byCategory, byPriority, avgResolutionHours, trend };
  }

  async exportCsv(user: ActingUser, type: ReportExportType, propertyId: string | undefined, months: number): Promise<{ filename: string; csv: string }> {
    switch (type) {
      case "occupancy": {
        const report = await this.getOccupancyReport(user, propertyId, months);
        return {
          filename: "occupancy-report.csv",
          csv: this.toCsv(report.byProperty, [
            { key: "propertyName", label: "Property" },
            { key: "total", label: "Total Units" },
            { key: "occupied", label: "Occupied" },
            { key: "vacant", label: "Vacant" },
          ]),
        };
      }
      case "income": {
        const report = await this.getIncomeReport(user, propertyId, months);
        return {
          filename: "income-report.csv",
          csv: this.toCsv(report.trend, [
            { key: "month", label: "Month" },
            { key: "expected", label: "Expected (KES)" },
            { key: "collected", label: "Collected (KES)" },
          ]),
        };
      }
      case "vacancies": {
        const report = await this.getVacancyReport(user, propertyId);
        return {
          filename: "vacancies-report.csv",
          csv: this.toCsv(
            report.units.map((u) => ({ ...u, vacantSince: u.vacantSince.toISOString().slice(0, 10) })),
            [
              { key: "propertyName", label: "Property" },
              { key: "unitCode", label: "Unit" },
              { key: "vacantSince", label: "Vacant Since" },
              { key: "daysVacant", label: "Days Vacant" },
            ],
          ),
        };
      }
      case "payments": {
        const report = await this.getPaymentsReport(user, propertyId, months);
        return {
          filename: "payments-report.csv",
          csv: this.toCsv(
            report.overdue.map((o) => ({ ...o, dueDate: o.dueDate ? o.dueDate.toISOString().slice(0, 10) : "" })),
            [
              { key: "tenantName", label: "Tenant" },
              { key: "propertyName", label: "Property" },
              { key: "unitCode", label: "Unit" },
              { key: "amount", label: "Amount (KES)" },
              { key: "dueDate", label: "Due Date" },
              { key: "daysOverdue", label: "Days Overdue" },
            ],
          ),
        };
      }
      case "maintenance": {
        const report = await this.getMaintenanceReport(user, propertyId, months);
        return {
          filename: "maintenance-report.csv",
          csv: this.toCsv(
            report.trend,
            [
              { key: "month", label: "Month" },
              { key: "created", label: "Created" },
              { key: "resolved", label: "Resolved" },
            ],
          ),
        };
      }
    }
  }

  async generatePrintableReport(user: ActingUser, propertyId: string | undefined, months: number): Promise<{ url: string }> {
    const [occupancy, income, vacancies, payments, maintenance] = await Promise.all([
      this.getOccupancyReport(user, propertyId, months),
      this.getIncomeReport(user, propertyId, months),
      this.getVacancyReport(user, propertyId),
      this.getPaymentsReport(user, propertyId, months),
      this.getMaintenanceReport(user, propertyId, months),
    ]);

    const html = this.renderReportHtml({ occupancy, income, vacancies, payments, maintenance, months });
    const url = await this.s3.putObject(`portfolio-reports/${user.id}`, html, "text/html");
    return { url };
  }

  private async resolvePropertyIds(user: ActingUser, propertyId?: string): Promise<string[]> {
    if (propertyId) {
      await this.access.assertAccess(user, propertyId);
      return [propertyId];
    }
    return this.access.accessiblePropertyIds(user);
  }

  private monthBuckets(months: number): MonthBucket[] {
    const now = new Date();
    const buckets: MonthBucket[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      buckets.push({ label: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`, start, end });
    }
    return buckets;
  }

  private toCsv(rows: Record<string, unknown>[], columns: { key: string; label: string }[]): string {
    const escape = (value: unknown): string => {
      const str = value === null || value === undefined ? "" : String(value);
      return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };
    const header = columns.map((c) => escape(c.label)).join(",");
    const lines = rows.map((row) => columns.map((c) => escape(row[c.key])).join(","));
    return [header, ...lines].join("\n");
  }

  private renderReportHtml(data: {
    occupancy: Awaited<ReturnType<ReportsService["getOccupancyReport"]>>;
    income: Awaited<ReturnType<ReportsService["getIncomeReport"]>>;
    vacancies: Awaited<ReturnType<ReportsService["getVacancyReport"]>>;
    payments: Awaited<ReturnType<ReportsService["getPaymentsReport"]>>;
    maintenance: Awaited<ReturnType<ReportsService["getMaintenanceReport"]>>;
    months: number;
  }): string {
    const fmtKES = (n: number) => `KES ${Math.round(n).toLocaleString("en-KE")}`;
    const fmtPct = (n: number) => `${Math.round(n * 100)}%`;
    const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

    const occupancyRows = data.occupancy.byProperty
      .map((p) => `<tr><td>${p.propertyName}</td><td>${p.total}</td><td>${p.occupied}</td><td>${p.vacant}</td></tr>`)
      .join("");
    const incomeRows = data.income.trend
      .map((t) => `<tr><td>${t.month}</td><td>${fmtKES(t.expected)}</td><td>${fmtKES(t.collected)}</td><td>${fmtPct(t.collectionRate)}</td></tr>`)
      .join("");
    const vacancyRows =
      data.vacancies.units
        .slice(0, 20)
        .map((u) => `<tr><td>${u.propertyName}</td><td>${u.unitCode}</td><td>${fmtDate(u.vacantSince)}</td><td>${u.daysVacant}</td></tr>`)
        .join("") || `<tr><td colspan="4">No vacant units.</td></tr>`;
    const overdueRows =
      data.payments.overdue
        .slice(0, 20)
        .map((o) => `<tr><td>${o.tenantName}</td><td>${o.propertyName} — ${o.unitCode}</td><td>${fmtKES(o.amount)}</td><td>${o.daysOverdue}</td></tr>`)
        .join("") || `<tr><td colspan="4">No overdue payments.</td></tr>`;

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Portfolio Report</title>
<style>body{font-family:sans-serif;max-width:760px;margin:40px auto;color:#0B140F}
h1{font-size:24px}h2{font-size:16px;color:#5C665F;text-transform:uppercase;margin-top:32px;border-bottom:1px solid #E4E2DA;padding-bottom:8px}
table{width:100%;border-collapse:collapse;margin-top:8px;font-size:13px}
th,td{padding:8px;border-bottom:1px solid #E4E2DA;text-align:left}
.stats{display:flex;gap:24px;margin-top:12px}
.stat{font-size:13px}.stat b{display:block;font-size:20px}</style></head>
<body>
<h1>Portfolio Report</h1>
<p>Last ${data.months} month${data.months > 1 ? "s" : ""}, generated ${fmtDate(new Date())}</p>

<h2>Occupancy</h2>
<div class="stats">
<div class="stat"><b>${data.occupancy.current.total}</b>Total units</div>
<div class="stat"><b>${data.occupancy.current.occupied}</b>Occupied</div>
<div class="stat"><b>${data.occupancy.current.vacant}</b>Vacant</div>
<div class="stat"><b>${fmtPct(data.occupancy.occupancyRate)}</b>Occupancy rate</div>
</div>
<table><tr><th>Property</th><th>Total</th><th>Occupied</th><th>Vacant</th></tr>${occupancyRows}</table>

<h2>Income</h2>
<div class="stats">
<div class="stat"><b>${fmtKES(data.income.totalExpected)}</b>Expected</div>
<div class="stat"><b>${fmtKES(data.income.totalCollected)}</b>Collected</div>
<div class="stat"><b>${fmtPct(data.income.collectionRate)}</b>Collection rate</div>
</div>
<table><tr><th>Month</th><th>Expected</th><th>Collected</th><th>Rate</th></tr>${incomeRows}</table>

<h2>Vacancies</h2>
<p>${data.vacancies.totalVacant} of ${data.vacancies.totalUnits} units vacant (${fmtPct(data.vacancies.vacancyRate)})</p>
<table><tr><th>Property</th><th>Unit</th><th>Vacant Since</th><th>Days</th></tr>${vacancyRows}</table>

<h2>Payments</h2>
<div class="stats">
<div class="stat"><b>${data.payments.byStatus.paid}</b>Paid</div>
<div class="stat"><b>${data.payments.byStatus.late}</b>Late</div>
<div class="stat"><b>${data.payments.byStatus.pending}</b>Pending</div>
<div class="stat"><b>${data.payments.byStatus.failed}</b>Failed</div>
</div>
<h2 style="margin-top:16px;font-size:14px;border-bottom:none">Overdue tenants</h2>
<table><tr><th>Tenant</th><th>Unit</th><th>Amount</th><th>Days overdue</th></tr>${overdueRows}</table>

<h2>Maintenance</h2>
<div class="stats">
<div class="stat"><b>${data.maintenance.totalTickets}</b>Total tickets</div>
<div class="stat"><b>${data.maintenance.openCount}</b>Open</div>
<div class="stat"><b>${data.maintenance.avgResolutionHours !== null ? Math.round(data.maintenance.avgResolutionHours) + "h" : "—"}</b>Avg. resolution time</div>
</div>
</body></html>`;
  }
}
