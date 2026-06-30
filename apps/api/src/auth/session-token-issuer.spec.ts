import { ServiceUnavailableException } from "@nestjs/common";
import { SessionTokenIssuer } from "./session-token-issuer";

describe("SessionTokenIssuer", () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it("signs and verifies a session token with the configured secret", async () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "production",
      SESSION_COOKIE_SECRET: "test-session-secret-at-least-local",
    };
    const issuer = new SessionTokenIssuer();

    const token = await issuer.sign("user-1", "session-1");

    await expect(issuer.verify(token)).resolves.toEqual({
      sessionId: "session-1",
      userId: "user-1",
    });
  });

  it("fails closed in production when SESSION_COOKIE_SECRET is missing", async () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "production",
      SESSION_COOKIE_SECRET: "",
    };
    const issuer = new SessionTokenIssuer();

    await expect(issuer.sign("user-1", "session-1")).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
