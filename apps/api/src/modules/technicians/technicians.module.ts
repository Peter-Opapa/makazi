import { Module } from "@nestjs/common";
import { TechniciansController } from "./technicians.controller";
import { TechniciansService } from "./technicians.service";
import { AccessModule } from "../../common/services/access.module";

@Module({
  imports: [AccessModule],
  controllers: [TechniciansController],
  providers: [TechniciansService],
  exports: [TechniciansService],
})
export class TechniciansModule {}
