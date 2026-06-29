import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { GroupMembershipPolicy } from "./group-membership-policy";
import { GroupsController } from "./groups.controller";
import { GroupsService } from "./groups.service";

@Module({
  imports: [AuthModule],
  controllers: [GroupsController],
  providers: [GroupMembershipPolicy, GroupsService],
  exports: [GroupMembershipPolicy],
})
export class GroupsModule {}
