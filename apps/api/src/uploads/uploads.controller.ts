import {
  Controller,
  Post,
  Req,
  ServiceUnavailableException,
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

    const origin = this.getPublicApiOrigin(request);
    const savedImage = await this.uploadsService.saveImage(file);

    return {
      url: `${origin}${savedImage.path}`,
    };
  }

  private getPublicApiOrigin(request: UploadRequest) {
    const configuredOrigin = process.env.PUBLIC_API_ORIGIN?.trim();

    if (configuredOrigin) {
      return configuredOrigin.replace(/\/+$/, "");
    }

    if (process.env.NODE_ENV === "production") {
      throw new ServiceUnavailableException(
        "PUBLIC_API_ORIGIN must be configured in production.",
      );
    }

    return `${this.getProtocol(request)}://${this.getHeaderValue(request.headers.host) ?? "localhost:3001"}`;
  }

  private getProtocol(request: UploadRequest) {
    const forwardedProto = request.headers["x-forwarded-proto"];

    return Array.isArray(forwardedProto)
      ? (forwardedProto[0] ?? "http")
      : (forwardedProto ?? "http");
  }

  private getHeaderValue(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value;
  }
}
