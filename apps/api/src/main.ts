import { join } from "node:path";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { rateLimitMiddleware } from "./security/rate-limit";
import { requestOriginMiddleware } from "./security/request-origin";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(cookieParser());
  app.use(rateLimitMiddleware());
  app.use(requestOriginMiddleware());
  app.useStaticAssets(
    process.env.UPLOADS_DIR ?? join(process.cwd(), "uploads"),
    {
      prefix: "/uploads/",
    },
  );
  app.enableCors({
    origin: process.env.WEB_ORIGIN?.split(",") ?? [
      "http://localhost:3000",
      "http://localhost:3002",
    ],
    credentials: true,
  });
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3001);
}

void bootstrap();
