import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
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
const MAX_IMAGE_DIMENSION_PX = 4096;

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

    const extension = detectImageExtension(file.buffer);
    const declaredExtension = imageMimeExtensions[file.mimetype];

    if (!extension) {
      throw new UnsupportedMediaTypeException("Unsupported image type.");
    }

    if (declaredExtension && declaredExtension !== extension) {
      throw new UnsupportedMediaTypeException(
        "Image content does not match its declared type.",
      );
    }

    const dimensions = readImageDimensions(file.buffer, extension);
    if (!dimensions) {
      throw new UnsupportedMediaTypeException(
        "Image dimensions could not be inspected.",
      );
    }
    if (
      dimensions.width < 1 ||
      dimensions.height < 1 ||
      dimensions.width > MAX_IMAGE_DIMENSION_PX ||
      dimensions.height > MAX_IMAGE_DIMENSION_PX
    ) {
      throw new BadRequestException("Image dimensions are too large.");
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
}

function detectImageExtension(buffer: Buffer) {
  if (isJpeg(buffer)) return ".jpg";
  if (isPng(buffer)) return ".png";
  if (isWebp(buffer)) return ".webp";
  if (isGif(buffer)) return ".gif";

  return null;
}

function isJpeg(buffer: Buffer) {
  return (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  );
}

function isPng(buffer: Buffer) {
  return (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  );
}

function isWebp(buffer: Buffer) {
  return (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  );
}

function isGif(buffer: Buffer) {
  if (buffer.length < 6) return false;

  const signature = buffer.subarray(0, 6).toString("ascii");

  return signature === "GIF87a" || signature === "GIF89a";
}

function readImageDimensions(buffer: Buffer, extension: string) {
  if (extension === ".png" && buffer.length >= 24) {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }

  if (extension === ".gif" && buffer.length >= 10) {
    return {
      width: buffer.readUInt16LE(6),
      height: buffer.readUInt16LE(8),
    };
  }

  if (extension === ".jpg") {
    return readJpegDimensions(buffer);
  }

  if (extension === ".webp") {
    return readWebpDimensions(buffer);
  }

  return null;
}

function readJpegDimensions(buffer: Buffer) {
  let offset = 2;

  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) return null;
    const marker = buffer[offset + 1];
    const segmentLength = buffer.readUInt16BE(offset + 2);

    if (segmentLength < 2 || offset + 2 + segmentLength > buffer.length) {
      return null;
    }

    if (
      marker === 0xc0 ||
      marker === 0xc1 ||
      marker === 0xc2 ||
      marker === 0xc3
    ) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }

    offset += 2 + segmentLength;
  }

  return null;
}

function readWebpDimensions(buffer: Buffer) {
  const chunkType = buffer.subarray(12, 16).toString("ascii");

  if (chunkType === "VP8X" && buffer.length >= 30) {
    return {
      width: 1 + readUInt24LE(buffer, 24),
      height: 1 + readUInt24LE(buffer, 27),
    };
  }

  if (chunkType === "VP8 " && buffer.length >= 30) {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }

  if (chunkType === "VP8L" && buffer.length >= 25) {
    const bits = buffer.readUInt32LE(21);

    return {
      width: 1 + (bits & 0x3fff),
      height: 1 + ((bits >> 14) & 0x3fff),
    };
  }

  return null;
}

function readUInt24LE(buffer: Buffer, offset: number) {
  return (
    buffer.readUInt8(offset) |
    (buffer.readUInt8(offset + 1) << 8) |
    (buffer.readUInt8(offset + 2) << 16)
  );
}
