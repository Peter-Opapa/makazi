import { Module } from "@nestjs/common";
import { PaymentChannelTemplatesController } from "./payment-channel-templates.controller";
import { PaymentChannelTemplatesService } from "./payment-channel-templates.service";

@Module({
  controllers: [PaymentChannelTemplatesController],
  providers: [PaymentChannelTemplatesService],
})
export class PaymentChannelsModule {}
