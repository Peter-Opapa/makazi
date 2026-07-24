import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
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
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ClerkIdentityGuard } from "../../common/guards/clerk-identity.guard";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { CurrentClerkIdentity, type ClerkIdentity } from "../../common/decorators/current-clerk-identity.decorator";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("forgot-password")
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post("forgot-password/verify-otp")
  verifyResetOtp(@Body() dto: VerifyResetOtpDto) {
    return this.authService.verifyResetOtp(dto);
  }

  @Post("reset-password")
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post("staff-login")
  staffLogin(@Body() dto: StaffLoginDto) {
    return this.authService.staffLogin(dto);
  }

  @Post("staff-login/verify-mfa")
  verifyStaffMfa(@Body() dto: VerifyStaffMfaDto) {
    return this.authService.verifyStaffMfa(dto);
  }

  @Post("claim-tenant/verify")
  verifyTenantCode(@Body() dto: VerifyTenantCodeDto) {
    return this.authService.verifyTenantCode(dto);
  }

  @Post("caretaker-invite/verify")
  verifyCaretakerInvite(@Body() dto: VerifyCaretakerInviteDto) {
    return this.authService.verifyCaretakerInvite(dto);
  }

  @Get("clerk/me")
  @UseGuards(ClerkIdentityGuard)
  async getClerkProfileStatus(@CurrentClerkIdentity() identity: ClerkIdentity) {
    const status = await this.authService.getClerkProfileStatus(identity.clerkUserId);
    if (status.exists) return status;
    // No Makazi profile yet — hand back the raw Clerk identity too, so
    // /finish-profile can prefill name/email instead of asking from scratch.
    return { ...status, identity: { firstName: identity.firstName, lastName: identity.lastName, email: identity.email } };
  }

  @Post("clerk/complete-profile")
  @UseGuards(ClerkIdentityGuard)
  completeClerkProfile(@CurrentClerkIdentity() identity: ClerkIdentity, @Body() dto: CompleteClerkProfileDto) {
    return this.authService.completeClerkProfile(identity, dto);
  }

  @Post("clerk/claim-tenant")
  @UseGuards(ClerkIdentityGuard)
  claimTenantWithClerk(@CurrentClerkIdentity() identity: ClerkIdentity, @Body() dto: VerifyTenantCodeDto) {
    return this.authService.claimTenantWithClerk(identity, dto);
  }

  @Post("clerk/claim-caretaker-invite")
  @UseGuards(ClerkIdentityGuard)
  claimCaretakerInviteWithClerk(
    @CurrentClerkIdentity() identity: ClerkIdentity,
    @Body() dto: VerifyCaretakerInviteDto,
  ) {
    return this.authService.claimCaretakerInviteWithClerk(identity, dto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user.id);
  }

  @Patch("me")
  @UseGuards(JwtAuthGuard)
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateMeDto) {
    return this.authService.updateMe(user.id, dto);
  }

  @Post("me/sync-email")
  @UseGuards(JwtAuthGuard)
  syncEmailFromClerk(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.syncEmailFromClerk(user.id);
  }

  @Post("me/photo/presign")
  @UseGuards(JwtAuthGuard)
  presignMePhoto(@CurrentUser() user: AuthenticatedUser, @Body() dto: PresignMePhotoDto) {
    return this.authService.presignMePhoto(user.id, dto);
  }

  @Post("me/photo")
  @UseGuards(JwtAuthGuard)
  confirmMePhoto(@CurrentUser() user: AuthenticatedUser, @Body() dto: ConfirmMePhotoDto) {
    return this.authService.confirmMePhoto(user.id, dto);
  }
}
