import { Injectable } from "@nestjs/common";
import { CaretakerInviteStatus, UserRole } from "@makazi/shared-types";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * Landlord first-login setup tracker. Computed live on every call, never
 * stored — same "derive, don't snapshot" pattern as Reports and Admin
 * Settings' connected-vs-simulator status.
 */
@Injectable()
export class SetupService {
  constructor(private readonly prisma: PrismaService) {}

  async getProgress(landlordId: string) {
    const [user, propertyCount, paymentAccountCount, caretakerCount, tenantCount] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: landlordId } }),
      this.prisma.property.count({ where: { landlordId } }),
      this.prisma.paymentAccount.count({ where: { property: { landlordId } } }),
      this.prisma.caretakerAssignment.count({
        where: { property: { landlordId }, inviteStatus: { not: CaretakerInviteStatus.DECLINED } },
      }),
      this.prisma.user.count({ where: { registeredById: landlordId, role: UserRole.TENANT } }),
    ]);

    return {
      accountCreated: true,
      emailVerified: user.emailVerifiedAt !== null,
      hasProperty: propertyCount > 0,
      hasPaymentDestination: paymentAccountCount > 0,
      hasCaretaker: caretakerCount > 0,
      hasTenant: tenantCount > 0,
    };
  }
}
