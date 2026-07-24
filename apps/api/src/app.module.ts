import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { IntegrationsModule } from "./integrations/integrations.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { PropertiesModule } from "./modules/properties/properties.module";
import { UnitsModule } from "./modules/units/units.module";
import { TenantsModule } from "./modules/tenants/tenants.module";
import { CaretakersModule } from "./modules/caretakers/caretakers.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { MaintenanceModule } from "./modules/maintenance/maintenance.module";
import { TechniciansModule } from "./modules/technicians/technicians.module";
import { InspectionsModule } from "./modules/inspections/inspections.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { LeaseModule } from "./modules/lease/lease.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { AuditLogModule } from "./modules/audit-log/audit-log.module";
import { SupportTicketsModule } from "./modules/support-tickets/support-tickets.module";
import { AdminModule } from "./modules/admin/admin.module";
import { InvitationsModule } from "./modules/invitations/invitations.module";
import { SetupModule } from "./modules/setup/setup.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    IntegrationsModule,
    InvitationsModule,
    AuthModule,
    UsersModule,
    PropertiesModule,
    UnitsModule,
    TenantsModule,
    CaretakersModule,
    PaymentsModule,
    MaintenanceModule,
    TechniciansModule,
    InspectionsModule,
    NotificationsModule,
    LeaseModule,
    ReportsModule,
    AuditLogModule,
    SupportTicketsModule,
    AdminModule,
    SetupModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
