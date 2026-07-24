import { Injectable } from "@nestjs/common";
import { PaymentStatus, UnitStatus, UserRole } from "@makazi/shared-types";
import { PrismaService } from "../../../prisma/prisma.service";

interface MonthBucket {
  label: string;
  start: Date;
  end: Date;
}

@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAnalytics(months = 12) {
    const buckets = this.monthBuckets(months);

    const [users, properties, units, tenancies, payments, maintenanceTickets, supportTickets] = await Promise.all([
      this.prisma.user.findMany({ select: { role: true, createdAt: true } }),
      this.prisma.property.findMany({ select: { id: true, county: true, createdAt: true } }),
      this.prisma.unit.findMany({ select: { id: true, propertyId: true, status: true, createdAt: true } }),
      this.prisma.tenancy.findMany({ select: { unitId: true, leaseStart: true, leaseEnd: true } }),
      this.prisma.payment.findMany({ where: { status: PaymentStatus.PAID }, select: { amount: true, paidAt: true } }),
      this.prisma.maintenanceTicket.findMany({ select: { createdAt: true, resolvedAt: true } }),
      this.prisma.supportTicket.findMany({ select: { createdAt: true, resolvedAt: true } }),
    ]);

    const userGrowth = buckets.map((bucket) => ({
      month: bucket.label,
      landlords: users.filter((u) => u.role === UserRole.LANDLORD && u.createdAt <= bucket.end).length,
      caretakers: users.filter((u) => u.role === UserRole.CARETAKER && u.createdAt <= bucket.end).length,
      tenants: users.filter((u) => u.role === UserRole.TENANT && u.createdAt <= bucket.end).length,
    }));

    const revenueTrend = buckets.map((bucket) => ({
      month: bucket.label,
      revenue: payments
        .filter((p) => p.paidAt && p.paidAt >= bucket.start && p.paidAt <= bucket.end)
        .reduce((sum, p) => sum + Number(p.amount), 0),
    }));

    const occupancyTrend = buckets.map((bucket) => {
      const unitsByThen = units.filter((u) => u.createdAt <= bucket.end);
      const occupiedUnitIds = new Set(
        tenancies.filter((t) => t.leaseStart <= bucket.end && (!t.leaseEnd || t.leaseEnd >= bucket.start)).map((t) => t.unitId),
      );
      const occupied = unitsByThen.filter((u) => occupiedUnitIds.has(u.id)).length;
      return {
        month: bucket.label,
        totalUnits: unitsByThen.length,
        occupiedUnits: occupied,
        occupancyRate: unitsByThen.length > 0 ? occupied / unitsByThen.length : 0,
      };
    });

    const maintenanceTrend = buckets.map((bucket) => ({
      month: bucket.label,
      created: maintenanceTickets.filter((t) => t.createdAt >= bucket.start && t.createdAt <= bucket.end).length,
      resolved: maintenanceTickets.filter((t) => t.resolvedAt && t.resolvedAt >= bucket.start && t.resolvedAt <= bucket.end).length,
    }));

    const supportTrend = buckets.map((bucket) => ({
      month: bucket.label,
      created: supportTickets.filter((t) => t.createdAt >= bucket.start && t.createdAt <= bucket.end).length,
      resolved: supportTickets.filter((t) => t.resolvedAt && t.resolvedAt >= bucket.start && t.resolvedAt <= bucket.end).length,
    }));

    const countyMap = new Map<string, { county: string; properties: number; units: number }>();
    for (const p of properties) {
      const county = p.county ?? "Unknown";
      const propertyUnits = units.filter((u) => u.propertyId === p.id).length;
      const entry = countyMap.get(county) ?? { county, properties: 0, units: 0 };
      entry.properties += 1;
      entry.units += propertyUnits;
      countyMap.set(county, entry);
    }
    const geoDistribution = [...countyMap.values()].sort((a, b) => b.properties - a.properties);

    return { userGrowth, revenueTrend, occupancyTrend, maintenanceTrend, supportTrend, geoDistribution };
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
}
