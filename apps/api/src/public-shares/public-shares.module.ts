import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { GroupsModule } from "../groups/groups.module";
import { PublicSharesController } from "./public-shares.controller";
import { PublicSharesService } from "./public-shares.service";

@Module({
  imports: [AuthModule, GroupsModule],
  controllers: [PublicSharesController],
  providers: [PublicSharesService],
})
export class PublicSharesModule {}
