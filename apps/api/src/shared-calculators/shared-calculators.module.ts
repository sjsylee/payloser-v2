import { Module } from "@nestjs/common";
import { SharedCalculatorLoader } from "./shared-calculator-loader";

@Module({
  providers: [SharedCalculatorLoader],
  exports: [SharedCalculatorLoader],
})
export class SharedCalculatorsModule {}
