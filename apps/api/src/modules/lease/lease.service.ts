import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { STORAGE_GATEWAY, type StorageGateway } from "../../integrations/storage/storage-gateway.types";

const LEASE_INCLUDE = {
  unit: { include: { property: { select: { id: true, name: true, location: true, county: true } } } },
} as const;

@Injectable()
export class LeaseService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_GATEWAY) private readonly s3: StorageGateway,
  ) {}

  async getCurrentLease(tenantId: string) {
    const tenancy = await this.prisma.tenancy.findFirst({
      where: { tenantId, active: true },
      include: LEASE_INCLUDE,
    });
    if (!tenancy) throw new NotFoundException("No active lease found");
    return tenancy;
  }

  async getLeaseDocument(tenantId: string) {
    const tenancy = await this.getActiveTenancyWithTenant(tenantId);
    if (tenancy.leaseDocumentUrl) return { url: tenancy.leaseDocumentUrl };

    const html = this.renderLeaseHtml({
      tenantName: `${tenancy.tenant.firstName} ${tenancy.tenant.lastName}`,
      propertyName: tenancy.unit.property.name,
      propertyLocation: tenancy.unit.property.location,
      unitCode: tenancy.unit.code,
      leaseStart: tenancy.leaseStart,
      leaseEnd: tenancy.leaseEnd,
      rentAmount: Number(tenancy.rentAmount),
      depositAmount: tenancy.depositAmount ? Number(tenancy.depositAmount) : 0,
    });
    const url = await this.s3.putObject(`lease-documents/${tenancy.id}`, html, "text/html");
    await this.prisma.tenancy.update({ where: { id: tenancy.id }, data: { leaseDocumentUrl: url } });
    return { url };
  }

  private async getActiveTenancyWithTenant(tenantId: string) {
    const tenancy = await this.prisma.tenancy.findFirst({
      where: { tenantId, active: true },
      include: { ...LEASE_INCLUDE, tenant: { select: { firstName: true, lastName: true } } },
    });
    if (!tenancy) throw new NotFoundException("No active lease found");
    return tenancy;
  }

  private renderLeaseHtml(data: {
    tenantName: string;
    propertyName: string;
    propertyLocation: string;
    unitCode: string;
    leaseStart: Date;
    leaseEnd: Date | null;
    rentAmount: number;
    depositAmount: number;
  }): string {
    const fmtKES = (n: number) => `KES ${n.toLocaleString("en-KE")}`;
    const fmtDate = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "Open-ended");

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Lease Agreement — ${data.unitCode}</title>
<style>body{font-family:sans-serif;max-width:640px;margin:40px auto;color:#0B140F}
h1{font-size:22px}h2{font-size:15px;color:#5C665F;text-transform:uppercase;margin-top:28px}
table{width:100%;border-collapse:collapse;margin-top:8px}
td{padding:8px;border-bottom:1px solid #E4E2DA}</style></head>
<body>
<h1>Lease Agreement</h1>
<p>${data.propertyName} — Unit ${data.unitCode}, ${data.propertyLocation}</p>
<h2>Tenant</h2>
<table><tr><td>Name</td><td>${data.tenantName}</td></tr></table>
<h2>Lease term</h2>
<table>
<tr><td>Lease start</td><td>${fmtDate(data.leaseStart)}</td></tr>
<tr><td>Lease end / renewal</td><td>${fmtDate(data.leaseEnd)}</td></tr>
</table>
<h2>Financials</h2>
<table>
<tr><td>Monthly rent</td><td>${fmtKES(data.rentAmount)}</td></tr>
<tr><td>Security deposit</td><td>${fmtKES(data.depositAmount)}</td></tr>
</table>
</body></html>`;
  }
}
