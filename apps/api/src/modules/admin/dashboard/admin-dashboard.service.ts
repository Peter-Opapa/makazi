import { Injectable } from "@nestjs/common";
import { MaintenanceStatus, PaymentStatus, SupportTicketStatus, UserRole } from "@makazi/shared-types";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalLandlords,
      totalCaretakers,
      totalTenants,
      totalProperties,
      totalUnits,
      totalPaymentsRecorded,
      paymentsToday,
      revenueTodayAgg,
      revenueMonthAgg,
      openMaintenanceCount,
      overdueMaintenanceCount,
      openSupportTickets,
      escalatedSupportTickets,
      activeUsers,
      pendingVerifications,
      geoDistribution,
      newLandlordsThisMonth,
      newTenantsThisMonth,
      newPropertiesThisMonth,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: UserRole.LANDLORD } }),
      this.prisma.user.count({ where: { role: UserRole.CARETAKER } }),
      this.prisma.user.count({ where: { role: UserRole.TENANT } }),
      this.prisma.property.count(),
      this.prisma.unit.count(),
      this.prisma.payment.count(),
      this.prisma.payment.count({ where: { status: PaymentStatus.PAID, paidAt: { gte: startOfToday } } }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: PaymentStatus.PAID, paidAt: { gte: startOfToday } },
      }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: PaymentStatus.PAID, paidAt: { gte: startOfMonth } },
      }),
      this.prisma.maintenanceTicket.count({
        where: { status: { in: [MaintenanceStatus.REPORTED, MaintenanceStatus.ASSIGNED, MaintenanceStatus.IN_PROGRESS] } },
      }),
      this.prisma.maintenanceTicket.count({
        where: {
          status: { in: [MaintenanceStatus.REPORTED, MaintenanceStatus.ASSIGNED, MaintenanceStatus.IN_PROGRESS] },
          createdAt: { lt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.supportTicket.count({
        where: { status: { in: [SupportTicketStatus.OPEN, SupportTicketStatus.IN_PROGRESS, SupportTicketStatus.ESCALATED] } },
      }),
      this.prisma.supportTicket.count({ where: { status: SupportTicketStatus.ESCALATED } }),
      this.prisma.user.count({ where: { suspendedAt: null, role: { not: UserRole.ADMIN } } }),
      this.prisma.user.count({ where: { identityVerifiedAt: null, role: { not: UserRole.ADMIN } } }),
      this.prisma.property.groupBy({ by: ["county"], _count: { _all: true } }),
      this.prisma.user.count({ where: { role: UserRole.LANDLORD, createdAt: { gte: startOfMonth } } }),
      this.prisma.user.count({ where: { role: UserRole.TENANT, createdAt: { gte: startOfMonth } } }),
      this.prisma.property.count({ where: { createdAt: { gte: startOfMonth } } }),
    ]);

    const totalWithCounty = geoDistribution.reduce((sum, g) => sum + g._count._all, 0);
    const geo = geoDistribution
      .map((g) => ({
        county: g.county ?? "Unknown",
        count: g._count._all,
        pct: totalWithCounty > 0 ? Math.round((g._count._all / totalWithCounty) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const revenueTrend = await this.revenueTrend(6);

    return {
      kpis: {
        totalLandlords,
        totalCaretakers,
        totalTenants,
        totalProperties,
        totalUnits,
        totalPaymentsRecorded,
        paymentsToday,
        revenueToday: Number(revenueTodayAgg._sum.amount ?? 0),
        monthlyRevenue: Number(revenueMonthAgg._sum.amount ?? 0),
        openMaintenanceCount,
        overdueMaintenanceCount,
        openSupportTickets,
        escalatedSupportTickets,
        activeUsers,
        pendingVerifications,
        newLandlordsThisMonth,
        newTenantsThisMonth,
        newPropertiesThisMonth,
      },
      geoDistribution: geo,
      revenueTrend,
    };
  }

  private async revenueTrend(months: number) {
    const now = new Date();
    const buckets = Array.from({ length: months }, (_, i) => {
      const start = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
      const end = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i) + 1, 0, 23, 59, 59, 999);
      return { label: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`, start, end };
    });

    const payments = await this.prisma.payment.findMany({
      where: { status: PaymentStatus.PAID, paidAt: { gte: buckets[0].start } },
      select: { amount: true, paidAt: true },
    });

    return buckets.map((bucket) => ({
      month: bucket.label,
      revenue: payments
        .filter((p) => p.paidAt && p.paidAt >= bucket.start && p.paidAt <= bucket.end)
        .reduce((sum, p) => sum + Number(p.amount), 0),
    }));
  }
}
