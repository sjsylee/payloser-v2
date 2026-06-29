import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { GroupsModule } from "../groups/groups.module";
import { PrismaModule } from "../prisma/prisma.module";
import { SettlementsModule } from "../settlements/settlements.module";
import { SharedCalculatorsModule } from "../shared-calculators/shared-calculators.module";
import { ScreenBaseballController } from "./screen-baseball.controller";
import { ScreenBaseballService } from "./screen-baseball.service";

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    GroupsModule,
    SettlementsModule,
    SharedCalculatorsModule,
  ],
  controllers: [ScreenBaseballController],
  providers: [ScreenBaseballService],
})
export class ScreenBaseballModule {}
