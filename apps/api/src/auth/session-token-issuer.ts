import { Injectable, UnauthorizedException } from "@nestjs/common";
import { jwtVerify, SignJWT } from "jose";

const SESSION_COOKIE_SECRET_FALLBACK =
  "payloser-local-development-secret-change-me";

@Injectable()
export class SessionTokenIssuer {
  async sign(userId: string) {
    return new SignJWT({ userId })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(getSessionSecret());
  }

  async verify(token: string) {
    const { payload } = await jwtVerify(token, getSessionSecret());
    const userId = payload.userId;

    if (typeof userId !== "string") {
      throw new UnauthorizedException("Invalid session.");
    }

    return {
      userId,
    };
  }
}

function getSessionSecret() {
  return new TextEncoder().encode(
    process.env.SESSION_COOKIE_SECRET ?? SESSION_COOKIE_SECRET_FALLBACK,
  );
}
