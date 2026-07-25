import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { UserRole } from "@makazi/shared-types";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { PaymentChannelTemplatesService } from "./payment-channel-templates.service";
import { UpsertPaymentChannelTemplateDto } from "./dto/upsert-payment-channel-template.dto";

// A landlord's own saved payment-channel address book — separate from the
// live per-property PaymentAccount that actually routes STK pushes.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.LANDLORD)
@Controller("payment-channel-templates")
export class PaymentChannelTemplatesController {
  constructor(private readonly service: PaymentChannelTemplatesService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.service.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpsertPaymentChannelTemplateDto) {
    return this.service.create(user.id, dto);
  }

  @Patch(":id")
  update(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpsertPaymentChannelTemplateDto) {
    return this.service.update(user.id, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.service.remove(user.id, id);
  }

  @Post(":id/set-default")
  setDefault(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.service.setDefault(user.id, id);
  }
}
