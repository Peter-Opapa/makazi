import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "crypto";
import { CaretakerInviteStatus, NotificationType, UserRole } from "@makazi/shared-types";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { InvitationEmailService } from "../invitations/invitation-email.service";
import { InviteCaretakerDto } from "./dto/invite-caretaker.dto";

const INVITE_TOKEN_TTL_DAYS = 14;

@Injectable()
export class CaretakersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly invitationEmail: InvitationEmailService,
  ) {}

  /**
   * Branches on whether the invited person already has a Makazi account:
   * - Existing CARETAKER account (matched by email or phone) -> unchanged
   *   in-app CaretakerAssignment accept/decline path (already tested).
   * - No match -> pre-create the User + CaretakerAssignment together (same
   *   pattern as TenantsService.registerTenant) and email a claim link. No
   *   email on file -> the link is returned for the landlord to relay
   *   manually instead, mirroring the tenantCode escape hatch.
   */
  async invite(landlordId: string, propertyId: string, dto: InviteCaretakerDto) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, landlordId },
      include: { landlord: { select: { firstName: true, lastName: true } } },
    });
    if (!property) throw new NotFoundException("Property not found");

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [dto.email ? { email: dto.email } : undefined, { phone: dto.phone }].filter(
          (clause): clause is NonNullable<typeof clause> => Boolean(clause),
        ),
      },
    });

    if (existing && existing.role !== UserRole.CARETAKER) {
      throw new ConflictException("This email or phone is already associated with a different Makazi account.");
    }

    if (existing) {
      if (existing.clerkUserId) {
        // Already claimed and active — safe for any landlord to invite via
        // the ordinary in-app assignment (accept/decline stays under the
        // caretaker's own control, and claimCaretakerInviteWithClerk is no
        // longer in play for them).
        return this.assignExistingCaretaker(existing.id, property.id, property.name);
      }

      // Still unclaimed. SECURITY: only the landlord who originally invited
      // this person may add more properties to their pending invite or
      // resend its token (see resendInvite and User.caretakerInvitedById).
      // Without this check, a different landlord could attach their own
      // PENDING assignment here, then use resendInvite to obtain the
      // caretaker's live invite token and — since claimCaretakerInviteWithClerk
      // bulk-accepts every PENDING assignment on claim — get themselves
      // ACCEPTED onto a property they were never actually invited to.
      if (existing.caretakerInvitedById !== landlordId) {
        throw new ConflictException(
          "This person has a pending invitation from another landlord. They'll need to accept or decline it before you can invite them.",
        );
      }
      return this.assignPendingCaretaker(existing.id, property.id);
    }

    return this.inviteNewCaretaker(landlordId, dto, property.id, property.name, `${property.landlord.firstName} ${property.landlord.lastName}`);
  }

  private async assignExistingCaretaker(caretakerId: string, propertyId: string, propertyName: string) {
    const assignment = await this.createAssignmentOrThrow(caretakerId, propertyId);

    await this.notifications.create(
      caretakerId,
      NotificationType.CARETAKER_INVITE,
      `You've been invited to manage ${propertyName}`,
      undefined,
      { propertyId, assignmentId: assignment.id },
    );

    return assignment;
  }

  /**
   * A pending, not-yet-claimed caretaker can't see an in-app notification
   * and has no clerkUserId for the generic notification fan-out to reach
   * usefully — they'll see every pending property at once when they open
   * their original invite link (see AuthService.verifyCaretakerInvite /
   * claimCaretakerInviteWithClerk). Only reachable for the SAME landlord who
   * originally invited them (enforced in invite() via caretakerInvitedById).
   */
  private assignPendingCaretaker(caretakerId: string, propertyId: string) {
    return this.createAssignmentOrThrow(caretakerId, propertyId);
  }

  private async createAssignmentOrThrow(caretakerId: string, propertyId: string) {
    const existingAssignment = await this.prisma.caretakerAssignment.findUnique({
      where: { caretakerId_propertyId: { caretakerId, propertyId } },
    });
    if (existingAssignment) throw new ConflictException("This caretaker is already invited or assigned to this property");

    return this.prisma.caretakerAssignment.create({
      data: { caretakerId, propertyId },
      include: { property: { select: { id: true, name: true, location: true } } },
    });
  }

  private async inviteNewCaretaker(
    landlordId: string,
    dto: InviteCaretakerDto,
    propertyId: string,
    propertyName: string,
    landlordName: string,
  ) {
    const caretakerInviteToken = randomBytes(32).toString("hex");
    const caretakerInviteTokenExpiresAt = new Date(Date.now() + INVITE_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    const { caretaker, assignment } = await this.prisma.$transaction(async (tx) => {
      const caretaker = await tx.user.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          email: dto.email,
          role: UserRole.CARETAKER,
          caretakerInviteToken,
          caretakerInviteTokenExpiresAt,
          caretakerInvitedById: landlordId,
        },
      });
      const assignment = await tx.caretakerAssignment.create({
        data: { caretakerId: caretaker.id, propertyId },
        include: { property: { select: { id: true, name: true, location: true } } },
      });
      return { caretaker, assignment };
    });

    if (dto.email) {
      await this.invitationEmail.sendCaretakerInvite(dto.email, dto.firstName, landlordName, [propertyName], caretakerInviteToken);
    }

    return { ...assignment, inviteToken: dto.email ? undefined : caretakerInviteToken };
  }

  /** Regenerates an expired/lost invite link for a not-yet-claimed caretaker. */
  async resendInvite(landlordId: string, caretakerId: string) {
    // SECURITY: scoped to caretakerInvitedById, not merely "has some
    // assignment tied to one of my properties" — a landlord could otherwise
    // manufacture that precondition themselves (via invite()) for a
    // caretaker actually invited by someone else, then use the resent token
    // to hijack that other invite (see invite()'s comment for the full
    // exploit this closes).
    const caretaker = await this.prisma.user.findFirst({
      where: { id: caretakerId, role: UserRole.CARETAKER, caretakerInvitedById: landlordId },
    });
    if (!caretaker) throw new NotFoundException("Caretaker not found");
    // clerkUserId covers both this invite flow's claim and a pre-existing
    // account that self-registered before this flow existed.
    if (caretaker.clerkUserId) throw new BadRequestException("This caretaker has already joined Makazi.");

    const assignments = await this.prisma.caretakerAssignment.findMany({
      where: { caretakerId, property: { landlordId }, inviteStatus: CaretakerInviteStatus.PENDING },
      include: { property: { select: { name: true } } },
    });
    const landlord = await this.prisma.user.findUniqueOrThrow({ where: { id: landlordId } });

    const caretakerInviteToken = randomBytes(32).toString("hex");
    const caretakerInviteTokenExpiresAt = new Date(Date.now() + INVITE_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
    await this.prisma.user.update({
      where: { id: caretakerId },
      data: { caretakerInviteToken, caretakerInviteTokenExpiresAt },
    });

    if (caretaker.email) {
      await this.invitationEmail.sendCaretakerInvite(
        caretaker.email,
        caretaker.firstName,
        `${landlord.firstName} ${landlord.lastName}`,
        assignments.map((a) => a.property.name),
        caretakerInviteToken,
      );
      return { resent: true };
    }
    return { resent: false, inviteToken: caretakerInviteToken };
  }

  async listForProperty(landlordId: string, propertyId: string) {
    const property = await this.prisma.property.findFirst({ where: { id: propertyId, landlordId } });
    if (!property) throw new NotFoundException("Property not found");
    return this.prisma.caretakerAssignment.findMany({
      where: { propertyId },
      include: { caretaker: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } } },
      orderBy: { invitedAt: "desc" },
    });
  }

  listMyInvites(caretakerId: string) {
    return this.prisma.caretakerAssignment.findMany({
      where: { caretakerId, inviteStatus: CaretakerInviteStatus.PENDING },
      include: { property: { select: { id: true, name: true, location: true, county: true } } },
      orderBy: { invitedAt: "desc" },
    });
  }

  async accept(caretakerId: string, assignmentId: string) {
    await this.findOwnPendingAssignment(caretakerId, assignmentId);

    const updated = await this.prisma.caretakerAssignment.update({
      where: { id: assignmentId },
      data: { inviteStatus: CaretakerInviteStatus.ACCEPTED, acceptedAt: new Date() },
      include: { property: true, caretaker: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } } },
    });

    await this.notifications.create(
      updated.property.landlordId,
      NotificationType.CARETAKER_INVITE_ACCEPTED,
      `${updated.caretaker.firstName} ${updated.caretaker.lastName} accepted your invite for ${updated.property.name}`,
    );

    return updated;
  }

  async decline(caretakerId: string, assignmentId: string) {
    await this.findOwnPendingAssignment(caretakerId, assignmentId);
    return this.prisma.caretakerAssignment.update({
      where: { id: assignmentId },
      data: { inviteStatus: CaretakerInviteStatus.DECLINED },
    });
  }

  private async findOwnPendingAssignment(caretakerId: string, assignmentId: string) {
    const assignment = await this.prisma.caretakerAssignment.findFirst({ where: { id: assignmentId, caretakerId } });
    if (!assignment) throw new NotFoundException("Invite not found");
    if (assignment.inviteStatus !== CaretakerInviteStatus.PENDING) {
      throw new ConflictException("This invite is no longer pending");
    }
    return assignment;
  }
}
