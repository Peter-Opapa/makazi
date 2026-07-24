import { Controller, Get, UseGuards } from "@nestjs/common";
import { UserRole } from "@makazi/shared-types";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { SetupService } from "./setup.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.LANDLORD)
@Controller("setup")
export class SetupController {
  constructor(private readonly setupService: SetupService) {}

  @Get("progress")
  getProgress(@CurrentUser() user: AuthenticatedUser) {
    return this.setupService.getProgress(user.id);
  }
}
