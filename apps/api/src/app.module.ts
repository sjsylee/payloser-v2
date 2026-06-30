import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { BowlingModule } from "./bowling/bowling.module";
import { GroupsModule } from "./groups/groups.module";
import { HealthController } from "./health.controller";
import { LocalRulesModule } from "./local-rules/local-rules.module";
import { PrismaModule } from "./prisma/prisma.module";
import { PublicSharesModule } from "./public-shares/public-shares.module";
import { RpsModule } from "./rps/rps.module";
import { ScreenBaseballModule } from "./screen-baseball/screen-baseball.module";
import { UploadsModule } from "./uploads/uploads.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    GroupsModule,
    BowlingModule,
    LocalRulesModule,
    PublicSharesModule,
    RpsModule,
    ScreenBaseballModule,
    UploadsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
