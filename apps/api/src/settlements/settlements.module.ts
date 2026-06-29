import { Module } from "@nestjs/common";
import { SettlementRecorder } from "./settlement-recorder";

@Module({
  providers: [SettlementRecorder],
  exports: [SettlementRecorder],
})
export class SettlementsModule {}
