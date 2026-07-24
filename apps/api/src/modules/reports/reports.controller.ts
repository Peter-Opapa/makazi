import { Controller, Get, Query, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { UserRole } from "@makazi/shared-types";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { ReportsService } from "./reports.service";
import { ReportQueryDto } from "./dto/report-query.dto";
import { ExportCsvQueryDto } from "./dto/export-csv-query.dto";

// Landlord: full portfolio. Caretaker: read-only, scoped to properties
// they're assigned to (same PropertyAccessService rule as everywhere else).
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.LANDLORD, UserRole.CARETAKER)
@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("dashboard-summary")
  getDashboardSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.getDashboardSummary(user);
  }

  @Get("occupancy")
  getOccupancy(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQueryDto) {
    return this.reportsService.getOccupancyReport(user, query.propertyId, query.months ?? 12);
  }

  @Get("income")
  getIncome(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQueryDto) {
    return this.reportsService.getIncomeReport(user, query.propertyId, query.months ?? 12);
  }

  @Get("vacancies")
  getVacancies(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQueryDto) {
    return this.reportsService.getVacancyReport(user, query.propertyId);
  }

  @Get("payments")
  getPayments(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQueryDto) {
    return this.reportsService.getPaymentsReport(user, query.propertyId, query.months ?? 12);
  }

  @Get("maintenance")
  getMaintenance(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQueryDto) {
    return this.reportsService.getMaintenanceReport(user, query.propertyId, query.months ?? 12);
  }

  @Get("export/csv")
  async exportCsv(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ExportCsvQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { filename, csv } = await this.reportsService.exportCsv(user, query.type, query.propertyId, query.months ?? 12);
    res.set({
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    });
    return csv;
  }

  @Get("export/print")
  generatePrintable(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQueryDto) {
    return this.reportsService.generatePrintableReport(user, query.propertyId, query.months ?? 12);
  }
}
