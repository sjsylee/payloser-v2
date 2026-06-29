import {
  Controller,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { SESSION_COOKIE_NAME } from "../auth/auth.constants";
import type { CookieRequest } from "../auth/auth.controller";
import { AuthService } from "../auth/auth.service";
import { UploadsService } from "./uploads.service";

type ImageFile = {
  buffer?: Buffer;
  mimetype: string;
  originalname?: string;
  size: number;
};

type UploadRequest = CookieRequest & {
  headers: Record<string, string | string[] | undefined>;
};

@Controller("uploads")
export class UploadsController {
  constructor(
    private readonly authService: AuthService,
    private readonly uploadsService: UploadsService,
  ) {}

  @Post("images")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: {
        fileSize: 3 * 1024 * 1024,
      },
    }),
  )
  async uploadImage(
    @UploadedFile() file: ImageFile,
    @Req() request: UploadRequest,
  ) {
    await this.authService.getSessionUser(
      request.cookies?.[SESSION_COOKIE_NAME],
    );

    const savedImage = await this.uploadsService.saveImage(file);
    const origin =
      process.env.PUBLIC_API_ORIGIN ??
      `${this.getProtocol(request)}://${request.headers.host ?? "localhost:3001"}`;

    return {
      url: `${origin}${savedImage.path}`,
    };
  }

  private getProtocol(request: UploadRequest) {
    const forwardedProto = request.headers["x-forwarded-proto"];

    return Array.isArray(forwardedProto)
      ? (forwardedProto[0] ?? "http")
      : (forwardedProto ?? "http");
  }
}
