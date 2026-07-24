import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { AdminPermission, PaymentStatus, UserRole } from "@makazi/shared-types";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { AdminPermissionGuard } from "../common/admin-permission.guard";
import { RequireAdminPermission } from "../common/admin-permission.decorator";
import { AdminPaymentsService } from "./admin-payments.service";
import { ResolveUnmatchedPaymentAdminDto } from "./dto/resolve-unmatched-payment.dto";

@UseGuards(JwtAuthGuard, RolesGuard, AdminPermissionGuard)
@Roles(UserRole.ADMIN)
@Controller("admin/payments")
export class AdminPaymentsController {
  constructor(private readonly paymentsService: AdminPaymentsService) {}

  @Get()
  list(@Query("status") status?: PaymentStatus, @Query("search") search?: string) {
    return this.paymentsService.list(status, search);
  }

  @Get("unmatched")
  listUnmatched(@Query("search") search?: string) {
    return this.paymentsService.listUnmatched(search);
  }

  @Get("unmatched/tenancy-search")
  searchActiveTenancies(@Query("search") search: string) {
    return this.paymentsService.searchActiveTenancies(search ?? "");
  }

  @RequireAdminPermission(AdminPermission.MANAGE_PAYMENTS)
  @Post("unmatched/:id/resolve")
  resolveUnmatched(
    @CurrentUser() actor: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: ResolveUnmatchedPaymentAdminDto,
  ) {
    return this.paymentsService.resolveUnmatched(actor.id, id, dto.tenancyId);
  }

  @Get(":id")
  getDetail(@Param("id") id: string) {
    return this.paymentsService.getDetail(id);
  }
}
