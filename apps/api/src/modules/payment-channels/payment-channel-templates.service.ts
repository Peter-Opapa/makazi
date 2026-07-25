import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { UpsertPaymentChannelTemplateDto } from "./dto/upsert-payment-channel-template.dto";

@Injectable()
export class PaymentChannelTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  list(landlordId: string) {
    return this.prisma.paymentChannelTemplate.findMany({
      where: { landlordId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });
  }

  /** The first saved channel becomes the default automatically — a landlord with exactly one channel shouldn't have to think about "default" at all. */
  async create(landlordId: string, dto: UpsertPaymentChannelTemplateDto) {
    const count = await this.prisma.paymentChannelTemplate.count({ where: { landlordId } });
    return this.prisma.paymentChannelTemplate.create({
      data: { ...dto, landlordId, isDefault: count === 0 },
    });
  }

  async update(landlordId: string, id: string, dto: UpsertPaymentChannelTemplateDto) {
    await this.findOwned(landlordId, id);
    return this.prisma.paymentChannelTemplate.update({ where: { id }, data: dto });
  }

  async remove(landlordId: string, id: string) {
    const channel = await this.findOwned(landlordId, id);
    await this.prisma.paymentChannelTemplate.delete({ where: { id } });
    // Promote another channel to default so a landlord with saved channels always has exactly one, if any remain.
    if (channel.isDefault) {
      const next = await this.prisma.paymentChannelTemplate.findFirst({ where: { landlordId }, orderBy: { createdAt: "asc" } });
      if (next) await this.prisma.paymentChannelTemplate.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  }

  async setDefault(landlordId: string, id: string) {
    await this.findOwned(landlordId, id);
    await this.prisma.$transaction([
      this.prisma.paymentChannelTemplate.updateMany({ where: { landlordId }, data: { isDefault: false } }),
      this.prisma.paymentChannelTemplate.update({ where: { id }, data: { isDefault: true } }),
    ]);
  }

  private async findOwned(landlordId: string, id: string) {
    const channel = await this.prisma.paymentChannelTemplate.findFirst({ where: { id, landlordId } });
    if (!channel) throw new NotFoundException("Payment channel not found");
    return channel;
  }
}
