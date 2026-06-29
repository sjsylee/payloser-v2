import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import {
  BadRequestException,
  Injectable,
  UnsupportedMediaTypeException,
} from "@nestjs/common";

const imageMimeExtensions: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

type UploadedImageFile = {
  buffer?: Buffer;
  mimetype: string;
  originalname?: string;
  size: number;
};

@Injectable()
export class UploadsService {
  private readonly uploadsRoot =
    process.env.UPLOADS_DIR ?? join(process.cwd(), "uploads");

  async saveImage(file: UploadedImageFile) {
    if (!file?.buffer || file.size <= 0) {
      throw new BadRequestException("Image file is required.");
    }

    const extension =
      imageMimeExtensions[file.mimetype] ??
      this.getAllowedExtension(file.originalname);

    if (!extension) {
      throw new UnsupportedMediaTypeException("Unsupported image type.");
    }

    const relativeDir = "groups";
    const filename = `${randomUUID()}${extension}`;
    const absoluteDir = join(this.uploadsRoot, relativeDir);
    const absolutePath = join(absoluteDir, filename);

    await mkdir(absoluteDir, { recursive: true });
    await writeFile(absolutePath, file.buffer);

    return {
      path: `/uploads/${relativeDir}/${filename}`,
    };
  }

  private getAllowedExtension(originalName: string | undefined) {
    const extension = extname(originalName ?? "").toLowerCase();

    return [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(extension)
      ? extension
      : null;
  }
}
