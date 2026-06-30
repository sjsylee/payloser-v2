import { ServiceUnavailableException } from "@nestjs/common";
import type { AuthService } from "../auth/auth.service";
import { UploadsController } from "./uploads.controller";
import type { UploadsService } from "./uploads.service";

describe("UploadsController", () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it("uses PUBLIC_API_ORIGIN when returning uploaded image URLs", async () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "production",
      PUBLIC_API_ORIGIN: "https://api.payloser.example/",
    };
    const authService = {
      getSessionUser: jest.fn().mockResolvedValue({ user: { id: "user-1" } }),
    } as unknown as AuthService;
    const uploadsService = {
      saveImage: jest.fn().mockResolvedValue({
        path: "/uploads/groups/image.png",
      }),
    } as unknown as UploadsService;
    const controller = new UploadsController(authService, uploadsService);

    await expect(
      controller.uploadImage(
        {
          buffer: Buffer.from([0x89]),
          mimetype: "image/png",
          size: 1,
        },
        {
          cookies: { payloser_session: "session-token" },
          headers: { host: "attacker.example" },
        },
      ),
    ).resolves.toEqual({
      url: "https://api.payloser.example/uploads/groups/image.png",
    });
  });

  it("fails closed in production when PUBLIC_API_ORIGIN is missing", async () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "production",
      PUBLIC_API_ORIGIN: "",
    };
    const authService = {
      getSessionUser: jest.fn().mockResolvedValue({ user: { id: "user-1" } }),
    } as unknown as AuthService;
    const uploadsService = {
      saveImage: jest.fn(),
    } as unknown as UploadsService;
    const controller = new UploadsController(authService, uploadsService);

    await expect(
      controller.uploadImage(
        {
          buffer: Buffer.from([0x89]),
          mimetype: "image/png",
          size: 1,
        },
        {
          cookies: { payloser_session: "session-token" },
          headers: { host: "api.payloser.example" },
        },
      ),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(uploadsService.saveImage).not.toHaveBeenCalled();
  });
});
