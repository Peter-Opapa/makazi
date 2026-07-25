import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { UserRole } from "@makazi/shared-types";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { CaretakersService } from "./caretakers.service";
import { InviteCaretakerDto } from "./dto/invite-caretaker.dto";
import { UpdateCaretakerContactDto } from "./dto/update-caretaker-contact.dto";

// Mixed audience (landlord invites, caretaker accepts/declines) — no class-level
// prefix or @Roles; each route sets its own full path and role.
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class CaretakersController {
  constructor(private readonly caretakersService: CaretakersService) {}

  @Roles(UserRole.LANDLORD)
  @Post("properties/:propertyId/caretaker-invites")
  invite(
    @CurrentUser() user: AuthenticatedUser,
    @Param("propertyId") propertyId: string,
    @Body() dto: InviteCaretakerDto,
  ) {
    return this.caretakersService.invite(user.id, propertyId, dto);
  }

  @Roles(UserRole.LANDLORD)
  @Get("properties/:propertyId/caretakers")
  listForProperty(@CurrentUser() user: AuthenticatedUser, @Param("propertyId") propertyId: string) {
    return this.caretakersService.listForProperty(user.id, propertyId);
  }

  @Roles(UserRole.LANDLORD)
  @Post("caretaker-invites/:caretakerId/resend")
  resendInvite(@CurrentUser() user: AuthenticatedUser, @Param("caretakerId") caretakerId: string) {
    return this.caretakersService.resendInvite(user.id, caretakerId);
  }

  @Roles(UserRole.LANDLORD)
  @Patch("caretaker-invites/:caretakerId")
  updateContact(
    @CurrentUser() user: AuthenticatedUser,
    @Param("caretakerId") caretakerId: string,
    @Body() dto: UpdateCaretakerContactDto,
  ) {
    return this.caretakersService.updateContact(user.id, caretakerId, dto);
  }

  @Roles(UserRole.LANDLORD)
  @Delete("properties/:propertyId/caretakers/:caretakerId")
  revoke(
    @CurrentUser() user: AuthenticatedUser,
    @Param("propertyId") propertyId: string,
    @Param("caretakerId") caretakerId: string,
  ) {
    return this.caretakersService.revoke(user.id, propertyId, caretakerId);
  }

  @Roles(UserRole.CARETAKER)
  @Get("caretaker/invites")
  listMyInvites(@CurrentUser() user: AuthenticatedUser) {
    return this.caretakersService.listMyInvites(user.id);
  }

  @Roles(UserRole.CARETAKER)
  @Post("caretaker/invites/:id/accept")
  accept(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.caretakersService.accept(user.id, id);
  }

  @Roles(UserRole.CARETAKER)
  @Post("caretaker/invites/:id/decline")
  decline(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.caretakersService.decline(user.id, id);
  }
}
