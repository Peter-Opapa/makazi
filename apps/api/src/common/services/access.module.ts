import { Module } from "@nestjs/common";
import { PropertyAccessService } from "./property-access.service";

@Module({
  providers: [PropertyAccessService],
  exports: [PropertyAccessService],
})
export class AccessModule {}
