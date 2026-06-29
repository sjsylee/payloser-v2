import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { GroupsModule } from "../groups/groups.module";
import { SharedCalculatorsModule } from "../shared-calculators/shared-calculators.module";
import { RpsController } from "./rps.controller";
import { RpsService } from "./rps.service";

@Module({
  imports: [AuthModule, GroupsModule, SharedCalculatorsModule],
  controllers: [RpsController],
  providers: [RpsService],
})
export class RpsModule {}
