import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { jwtVerify, SignJWT } from "jose";

const SESSION_COOKIE_SECRET_FALLBACK =
  "payloser-local-development-secret-change-me";

@Injectable()
export class SessionTokenIssuer {
  async sign(userId: string, sessionId: string) {
    return new SignJWT({ sessionId, userId })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(getSessionSecret());
  }

  async verify(token: string) {
    const { payload } = await jwtVerify(token, getSessionSecret());
    const sessionId = payload.sessionId;
    const userId = payload.userId;

    if (typeof sessionId !== "string") {
      throw new UnauthorizedException("Invalid session.");
    }

    if (typeof userId !== "string") {
      throw new UnauthorizedException("Invalid session.");
    }

    return {
      sessionId,
      userId,
    };
  }
}

function getSessionSecret() {
  const configuredSecret = process.env.SESSION_COOKIE_SECRET?.trim();

  if (configuredSecret) {
    return new TextEncoder().encode(configuredSecret);
  }

  if (process.env.NODE_ENV === "production") {
    throw new ServiceUnavailableException(
      "SESSION_COOKIE_SECRET must be configured in production.",
    );
  }

  return new TextEncoder().encode(SESSION_COOKIE_SECRET_FALLBACK);
}
