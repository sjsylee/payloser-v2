import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { GroupsModule } from "../groups/groups.module";
import { SettlementsModule } from "../settlements/settlements.module";
import { SharedCalculatorsModule } from "../shared-calculators/shared-calculators.module";
import { BowlingController } from "./bowling.controller";
import { BowlingService } from "./bowling.service";

@Module({
  imports: [
    AuthModule,
    GroupsModule,
    SettlementsModule,
    SharedCalculatorsModule,
  ],
  controllers: [BowlingController],
  providers: [BowlingService],
})
export class BowlingModule {}
