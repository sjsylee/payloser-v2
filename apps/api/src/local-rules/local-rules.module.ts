import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { GroupsModule } from "../groups/groups.module";
import { LocalRulesController } from "./local-rules.controller";
import { LocalRulesService } from "./local-rules.service";

@Module({
  imports: [AuthModule, GroupsModule],
  controllers: [LocalRulesController],
  providers: [LocalRulesService],
})
export class LocalRulesModule {}
