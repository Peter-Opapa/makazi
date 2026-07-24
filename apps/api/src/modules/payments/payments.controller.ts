import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { UserRole } from "@makazi/shared-types";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { PaymentsService } from "./payments.service";
import { InitiatePaymentDto } from "./dto/initiate-payment.dto";
import { ListLedgerDto } from "./dto/list-ledger.dto";
import { ResolveUnmatchedPaymentDto } from "./dto/resolve-unmatched-payment.dto";

// Tenant: self-service (rent status, pay, history, receipts, rental passport).
// Landlord/Caretaker: portfolio-wide ledger and unmatched-PayBill reconciliation.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TENANT)
@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get("rent-status")
  getRentStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.getRentStatus(user.id);
  }

  @Get("rental-passport")
  getRentalPassport(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.getRentalPassport(user.id);
  }

  @Post("initiate")
  initiate(@CurrentUser() user: AuthenticatedUser, @Body() dto: InitiatePaymentDto) {
    return this.paymentsService.initiatePayment(user.id, dto);
  }

  @Roles(UserRole.LANDLORD, UserRole.CARETAKER)
  @Get("ledger")
  listLedger(@CurrentUser() user: AuthenticatedUser, @Query() query: ListLedgerDto) {
    return this.paymentsService.listLedger(user, query);
  }

  @Roles(UserRole.LANDLORD, UserRole.CARETAKER)
  @Get("unmatched")
  listUnmatched(@CurrentUser() user: AuthenticatedUser, @Query("propertyId") propertyId?: string) {
    return this.paymentsService.listUnmatchedPayments(user, propertyId);
  }

  @Roles(UserRole.LANDLORD, UserRole.CARETAKER)
  @Post("unmatched/:id/resolve")
  resolveUnmatched(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: ResolveUnmatchedPaymentDto,
  ) {
    return this.paymentsService.resolveUnmatchedPayment(user, id, dto.tenancyId);
  }

  @Get(":id/receipt")
  getReceipt(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.paymentsService.getReceipt(user.id, id);
  }

  @Get(":id")
  getPayment(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.paymentsService.getPayment(user.id, id);
  }

  @Get()
  listPayments(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.listPayments(user.id);
  }
}
