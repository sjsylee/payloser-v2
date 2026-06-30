import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { UnsupportedMediaTypeException } from "@nestjs/common";
import { UploadsService } from "./uploads.service";

describe("UploadsService", () => {
  const originalEnv = process.env;
  let uploadsDir: string;

  beforeEach(async () => {
    uploadsDir = await mkdtemp(join(tmpdir(), "payloser-uploads-"));
    process.env = {
      ...originalEnv,
      UPLOADS_DIR: uploadsDir,
    };
  });

  afterEach(async () => {
    process.env = originalEnv;
    await rm(uploadsDir, { force: true, recursive: true });
    jest.restoreAllMocks();
  });

  it("stores an image using the detected file signature extension", async () => {
    const service = new UploadsService();
    const png = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x40, 0x00, 0x00, 0x00, 0x40,
    ]);

    const saved = await service.saveImage({
      buffer: png,
      mimetype: "image/png",
      originalname: "group.jpg",
      size: png.length,
    });

    expect(saved.path).toMatch(/^\/uploads\/groups\/.+\.png$/);
    await expect(
      readFile(join(uploadsDir, saved.path.replace("/uploads/", ""))),
    ).resolves.toEqual(png);
  });

  it("rejects files whose bytes are not a supported image", async () => {
    const service = new UploadsService();

    await expect(
      service.saveImage({
        buffer: Buffer.from("<svg></svg>"),
        mimetype: "image/svg+xml",
        originalname: "group.jpg",
        size: 11,
      }),
    ).rejects.toBeInstanceOf(UnsupportedMediaTypeException);
  });

  it("rejects images whose declared MIME type conflicts with the bytes", async () => {
    const service = new UploadsService();
    const jpeg = Buffer.from([
      0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x40, 0x00, 0x40,
    ]);

    await expect(
      service.saveImage({
        buffer: jpeg,
        mimetype: "image/png",
        originalname: "group.png",
        size: jpeg.length,
      }),
    ).rejects.toBeInstanceOf(UnsupportedMediaTypeException);
  });

  it("rejects images with dimensions over the local/MVP limit", async () => {
    const service = new UploadsService();
    const hugePng = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x10, 0x01, 0x00, 0x00, 0x00, 0x40,
    ]);

    await expect(
      service.saveImage({
        buffer: hugePng,
        mimetype: "image/png",
        originalname: "huge.png",
        size: hugePng.length,
      }),
    ).rejects.toThrow("Image dimensions are too large.");
  });
});
