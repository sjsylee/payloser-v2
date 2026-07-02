import type { NextConfig } from "next";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = join(currentDir, "../..");
const rootEnvPath = join(workspaceRoot, ".env");

const publicEnvKeys = [
  "NEXT_PUBLIC_API_BASE_URL",
  "NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY",
] as const;

// KR: apps/web 기준 Next dev가 루트 .env를 자동으로 읽지 않아 public env만 보강한다.
// EN: Next dev runs from apps/web, so only public root env values are filled when missing.
if (existsSync(rootEnvPath)) {
  const rootEnv = new Map(
    readFileSync(rootEnvPath, "utf8")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const [key, ...valueParts] = line.split("=");
        const value = valueParts
          .join("=")
          .trim()
          .replace(/^["']|["']$/g, "");

        return [key, value] as const;
      }),
  );

  for (const key of publicEnvKeys) {
    if (process.env[key]) {
      continue;
    }

    const value = rootEnv.get(key);

    if (value) {
      process.env[key] = value;
    }
  }
}

const nextConfig: NextConfig = {
  devIndicators: false,
  outputFileTracingRoot: workspaceRoot,
  transpilePackages: ["@payloser/shared"],
};

export default nextConfig;
