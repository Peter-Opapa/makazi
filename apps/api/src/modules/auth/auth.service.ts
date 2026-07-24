import { BadRequestException, ConflictException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { createClerkClient, type ClerkClient } from "@clerk/backend";
import * as bcrypt from "bcrypt";
import { randomInt } from "crypto";
import { CaretakerInviteStatus, NotificationType, UserRole } from "@makazi/shared-types";
import { PrismaService } from "../../prisma/prisma.service";
import { EmailService } from "./email.service";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { VerifyResetOtpDto } from "./dto/verify-reset-otp.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { StaffLoginDto } from "./dto/staff-login.dto";
import { VerifyStaffMfaDto } from "./dto/verify-staff-mfa.dto";
import { VerifyTenantCodeDto } from "./dto/verify-tenant-code.dto";
import { VerifyCaretakerInviteDto } from "./dto/verify-caretaker-invite.dto";
import { CompleteClerkProfileDto } from "./dto/complete-clerk-profile.dto";
import { UpdateMeDto } from "./dto/update-me.dto";
import { PresignMePhotoDto } from "./dto/presign-me-photo.dto";
import { ConfirmMePhotoDto } from "./dto/confirm-me-photo.dto";
import { NotificationsService } from "../notifications/notifications.service";
import { STORAGE_GATEWAY, type StorageGateway } from "../../integrations/storage/storage-gateway.types";
import type { ClerkIdentity } from "../../common/decorators/current-clerk-identity.decorator";

const SALT_ROUNDS = 10;
const OTP_TTL_MINUTES = 15;

interface SanitizableUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role: string;
  adminSubRole: string | null;
  emailVerifiedAt: Date | null;
  nationalId: string | null;
  profilePhotoUrl: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
}

@Injectable()
export class AuthService {
  private readonly clerkClient: ClerkClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly email: EmailService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
    @Inject(STORAGE_GATEWAY) private readonly storage: StorageGateway,
  ) {
    this.clerkClient = createClerkClient({ secretKey: this.config.getOrThrow<string>("CLERK_SECRET_KEY") });
  }

  // ---------- Forgot / reset password (Admin/staff only — Landlord/Caretaker/Tenant use their Makazi account's own reset flow) ----------

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (user) {
      const code = this.generateOtp();
      const passwordResetCodeHash = await bcrypt.hash(code, SALT_ROUNDS);
      const passwordResetExpiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordResetCodeHash, passwordResetExpiresAt },
      });
      await this.email.sendPasswordResetCode(dto.email, code);
    }

    // Same response whether or not the email is registered, so this flow
    // can't be used to enumerate accounts.
    return { message: "If that email is registered, a reset code has been sent" };
  }

  async verifyResetOtp(dto: VerifyResetOtpDto) {
    const user = await this.getUserWithValidResetCode(dto.email, dto.code);
    if (!user) throw new BadRequestException("Incorrect or expired code");
    return { valid: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.getUserWithValidResetCode(dto.email, dto.code);
    if (!user) throw new BadRequestException("Incorrect or expired code");

    const passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordResetCodeHash: null, passwordResetExpiresAt: null },
    });
    return { message: "Password updated" };
  }

  private async getUserWithValidResetCode(email: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordResetCodeHash || !user.passwordResetExpiresAt) return null;
    if (user.passwordResetExpiresAt < new Date()) return null;
    const valid = await bcrypt.compare(code, user.passwordResetCodeHash);
    return valid ? user : null;
  }

  // ---------- Staff (Admin) login: creds -> MFA ----------

  async staffLogin(dto: StaffLoginDto) {
    await this.verifyStaffCredentials(dto.email, dto.password);
    // Real MFA (TOTP secret enrollment + code verification) is deferred —
    // see README "Known Simplifications". This step only confirms
    // credentials and moves the UI to the MFA screen, matching the
    // approved Staff Login flow (creds -> MFA -> dashboard).
    return { mfaRequired: true };
  }

  async verifyStaffMfa(dto: VerifyStaffMfaDto) {
    const user = await this.verifyStaffCredentials(dto.email, dto.password);
    // Deferred: any well-formed 6-digit code is accepted for now (see staffLogin above).
    return { ...this.issueToken(user.id, user.role), user: this.sanitizeUser(user) };
  }

  private async verifyStaffCredentials(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    const valid = user?.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !valid || user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException("Invalid credentials");
    }
    if (user.suspendedAt) throw new UnauthorizedException("This account has been suspended");
    return user;
  }

  // ---------- Tenant Code claim (tenant created via Assign Tenant, no Makazi account yet) ----------

  async verifyTenantCode(dto: VerifyTenantCodeDto) {
    const user = await this.getUnclaimedTenantByCode(dto.tenantCode);
    const tenancy = await this.prisma.tenancy.findFirst({
      where: { tenantId: user.id, active: true },
      orderBy: { createdAt: "desc" },
      include: { unit: { include: { property: true } } },
    });

    return {
      firstName: user.firstName,
      lastName: user.lastName,
      unit: tenancy
        ? {
            code: tenancy.unit.code,
            rentAmount: tenancy.rentAmount,
            property: { name: tenancy.unit.property.name, location: tenancy.unit.property.location },
          }
        : null,
    };
  }

  private async getUnclaimedTenantByCode(tenantCode: string) {
    const user = await this.prisma.user.findUnique({ where: { tenantCode } });
    if (!user || user.role !== UserRole.TENANT) throw new BadRequestException("Invalid invitation code");
    if (user.tenantCodeClaimedAt) throw new BadRequestException("This invitation has already been used");
    return user;
  }

  // ---------- Caretaker invite claim (caretaker pre-created via CaretakersService.invite, no Makazi account yet) ----------

  async verifyCaretakerInvite(dto: VerifyCaretakerInviteDto) {
    const user = await this.getUnclaimedCaretakerByToken(dto.token);
    const assignments = await this.prisma.caretakerAssignment.findMany({
      where: { caretakerId: user.id, inviteStatus: CaretakerInviteStatus.PENDING },
      include: { property: { include: { landlord: true } } },
    });

    const landlord = assignments[0]?.property.landlord;
    return {
      firstName: user.firstName,
      lastName: user.lastName,
      landlordName: landlord ? `${landlord.firstName} ${landlord.lastName}` : null,
      properties: assignments.map((a) => ({ id: a.property.id, name: a.property.name })),
    };
  }

  private async getUnclaimedCaretakerByToken(token: string) {
    const user = await this.prisma.user.findUnique({ where: { caretakerInviteToken: token } });
    if (!user || user.role !== UserRole.CARETAKER) throw new BadRequestException("Invalid invitation link");
    if (user.caretakerInviteClaimedAt) throw new BadRequestException("This invitation has already been used");
    if (user.caretakerInviteTokenExpiresAt && user.caretakerInviteTokenExpiresAt < new Date()) {
      throw new BadRequestException("This invitation link has expired — ask your landlord to resend it");
    }
    return user;
  }

  /** Same shape as claimTenantWithClerk — links a verified Makazi account to the pre-created caretaker row and accepts their pending property assignments. */
  async claimCaretakerInviteWithClerk(identity: ClerkIdentity, dto: VerifyCaretakerInviteDto) {
    const user = await this.getUnclaimedCaretakerByToken(dto.token);

    const existingClerkLink = await this.prisma.user.findUnique({ where: { clerkUserId: identity.clerkUserId } });
    if (existingClerkLink) throw new ConflictException("This account is already linked to a different Makazi profile.");

    const updated = await this.prisma.$transaction(async (tx) => {
      const linked = await tx.user.update({
        where: { id: user.id },
        data: {
          clerkUserId: identity.clerkUserId,
          email: user.email ?? identity.email,
          phone: user.phone ?? identity.phone,
          emailVerifiedAt: user.emailVerifiedAt ?? (identity.email ? new Date() : null),
          caretakerInviteClaimedAt: new Date(),
          caretakerInviteToken: null,
          caretakerInviteTokenExpiresAt: null,
        },
      });

      // Defense-in-depth: only bulk-accept assignments on properties owned
      // by the SAME landlord who issued this invite (caretakerInvitedById).
      // CaretakersService.invite() already refuses to let a different
      // landlord attach a PENDING assignment to someone else's unclaimed
      // invitee, so this should never actually filter anything out in
      // practice — but a claim flow is exactly the kind of security-critical
      // bulk operation worth not trusting on a single upstream check alone.
      // Fail closed (accept nothing) if caretakerInvitedById is somehow
      // unset rather than silently matching every property.
      const assignments = user.caretakerInvitedById
        ? await tx.caretakerAssignment.findMany({
            where: {
              caretakerId: user.id,
              inviteStatus: CaretakerInviteStatus.PENDING,
              property: { landlordId: user.caretakerInvitedById },
            },
            include: { property: true },
          })
        : [];
      await tx.caretakerAssignment.updateMany({
        where: { id: { in: assignments.map((a) => a.id) } },
        data: { inviteStatus: CaretakerInviteStatus.ACCEPTED, acceptedAt: new Date() },
      });

      return { linked, assignments };
    });

    for (const assignment of updated.assignments) {
      await this.notifications.create(
        assignment.property.landlordId,
        NotificationType.CARETAKER_INVITE_ACCEPTED,
        `${updated.linked.firstName} ${updated.linked.lastName} accepted your invite for ${assignment.property.name}`,
      );
    }

    return this.sanitizeUser(updated.linked);
  }

  // ---------- Clerk (Landlord sign-up; Caretaker/Tenant sign-in only — see ClerkStrategy/ClerkIdentityStrategy) ----------

  /** Lets the frontend decide "go straight to dashboard" vs "finish profile" right after a Makazi sign-in. */
  async getClerkProfileStatus(clerkUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { clerkUserId } });
    if (!user) return { exists: false as const };
    return { exists: true as const, user: this.sanitizeUser(user) };
  }

  /**
   * First time a Clerk identity is ever seen by Makazi. Landlord-only —
   * Caretaker/Tenant accounts are always pre-created by an invitation
   * (see CaretakersService.invite / TenantsService.registerTenant) and
   * linked via claimCaretakerInviteWithClerk / claimTenantWithClerk instead,
   * never created fresh here.
   */
  async completeClerkProfile(identity: ClerkIdentity, dto: CompleteClerkProfileDto) {
    const existing = await this.prisma.user.findUnique({ where: { clerkUserId: identity.clerkUserId } });
    if (existing) return this.sanitizeUser(existing);

    if (identity.email) {
      const existingEmail = await this.prisma.user.findUnique({ where: { email: identity.email } });
      if (existingEmail) throw new ConflictException("An account with this email already exists.");
    }

    const existingPhone = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (existingPhone) throw new ConflictException("An account with this phone number already exists.");

    const firstName = (dto.firstName || identity.firstName).trim();
    const lastName = (dto.lastName || identity.lastName).trim();
    if (!firstName || !lastName) throw new BadRequestException("Full name is required.");

    const user = await this.prisma.user.create({
      data: {
        clerkUserId: identity.clerkUserId,
        firstName,
        lastName,
        email: identity.email,
        phone: dto.phone,
        role: UserRole.LANDLORD,
        emailVerifiedAt: identity.email ? new Date() : null,
        // Phone is collected but never verified in v1 — no OTP is sent to it.
      },
    });

    return this.sanitizeUser(user);
  }

  /** Links a verified Makazi account to the pre-created tenant row instead of setting a password — preserves the pre-existing User.id so Tenancy FKs stay intact. */
  async claimTenantWithClerk(identity: ClerkIdentity, dto: VerifyTenantCodeDto) {
    const user = await this.getUnclaimedTenantByCode(dto.tenantCode);

    const existingClerkLink = await this.prisma.user.findUnique({ where: { clerkUserId: identity.clerkUserId } });
    if (existingClerkLink) throw new ConflictException("This account is already linked to a different Makazi profile.");

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        clerkUserId: identity.clerkUserId,
        email: user.email ?? identity.email,
        phone: user.phone ?? identity.phone,
        emailVerifiedAt: user.emailVerifiedAt ?? (identity.email ? new Date() : null),
        tenantCodeClaimedAt: new Date(),
      },
    });

    return this.sanitizeUser(updated);
  }

  // ---------- Shared ----------

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.sanitizeUser(user);
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    if (dto.nationalId) {
      const existing = await this.prisma.user.findUnique({ where: { nationalId: dto.nationalId } });
      if (existing && existing.id !== userId) {
        // Deliberately generic — confirming *whose* national ID is already
        // registered would leak PII to anyone who can guess/knows a real ID
        // number and is willing to try submitting it.
        throw new ConflictException("We couldn't save that national ID — please check it and try again.");
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        nationalId: dto.nationalId,
        emergencyContactName: dto.emergencyContactName,
        emergencyContactPhone: dto.emergencyContactPhone,
      },
    });
    return this.sanitizeUser(user);
  }

  /**
   * Email is Clerk's data, not Makazi's (see the auth architecture's data-
   * ownership split) — a user changes it via Clerk's own account UI, not a
   * Makazi form. This just re-reads the live Clerk identity and mirrors it
   * into our own cached `User.email` column, which nothing else keeps in
   * sync automatically. A no-op if nothing changed on Clerk's side.
   */
  async syncEmailFromClerk(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (!user.clerkUserId) return this.sanitizeUser(user);

    const clerkUser = await this.clerkClient.users.getUser(user.clerkUserId);
    const liveEmail = clerkUser.primaryEmailAddress?.emailAddress ?? null;
    if (!liveEmail || liveEmail === user.email) return this.sanitizeUser(user);

    const collision = await this.prisma.user.findUnique({ where: { email: liveEmail } });
    if (collision && collision.id !== userId) {
      // Extremely unlikely (Clerk itself enforces unique emails across
      // identities), but never let a raw DB constraint error surface here.
      return this.sanitizeUser(user);
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { email: liveEmail, emailVerifiedAt: new Date() },
    });
    return this.sanitizeUser(updated);
  }

  async presignMePhoto(userId: string, dto: PresignMePhotoDto) {
    return this.storage.createPresignedUploadUrl(`users/${userId}/photo`, dto.contentType);
  }

  async confirmMePhoto(userId: string, dto: ConfirmMePhotoDto) {
    const existing = await this.prisma.user.findUnique({ where: { id: userId } });
    const url = this.storage.publicUrlFor(dto.key);
    const user = await this.prisma.user.update({ where: { id: userId }, data: { profilePhotoUrl: url } });
    if (existing?.profilePhotoUrl) {
      await this.storage.deleteObjectByUrl(existing.profilePhotoUrl).catch(() => undefined);
    }
    return this.sanitizeUser(user);
  }

  private generateOtp() {
    return randomInt(0, 1_000_000).toString().padStart(6, "0");
  }

  private issueToken(userId: string, role: string) {
    return { accessToken: this.jwt.sign({ sub: userId, role }) };
  }

  private sanitizeUser(user: SanitizableUser) {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      adminSubRole: user.adminSubRole,
      emailVerifiedAt: user.emailVerifiedAt,
      nationalId: user.nationalId,
      profilePhotoUrl: user.profilePhotoUrl,
      emergencyContactName: user.emergencyContactName,
      emergencyContactPhone: user.emergencyContactPhone,
    };
  }
}
