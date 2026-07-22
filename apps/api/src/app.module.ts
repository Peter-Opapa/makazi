import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { PropertiesModule } from "./modules/properties/properties.module";
import { UnitsModule } from "./modules/units/units.module";
import { TenantsModule } from "./modules/tenants/tenants.module";
import { CaretakersModule } from "./modules/caretakers/caretakers.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { MaintenanceModule } from "./modules/maintenance/maintenance.module";
import { InspectionsModule } from "./modules/inspections/inspections.module";
import { AuditLogModule } from "./modules/audit-log/audit-log.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PropertiesModule,
    UnitsModule,
    TenantsModule,
    CaretakersModule,
    PaymentsModule,
    MaintenanceModule,
    InspectionsModule,
    AuditLogModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
