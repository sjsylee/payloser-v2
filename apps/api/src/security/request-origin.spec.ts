import {
  getTrustedOriginsFromEnv,
  isTrustedRequestOrigin,
  requestOriginMiddleware,
} from "./request-origin";

describe("request origin protection", () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it("allows safe methods without an origin header", () => {
    expect(
      isTrustedRequestOrigin({
        method: "GET",
        headers: {},
      }),
    ).toBe(true);
  });

  it("allows unsafe methods from configured web origins", () => {
    expect(
      isTrustedRequestOrigin(
        {
          method: "POST",
          headers: {
            origin: "https://payloser.example",
          },
        },
        ["https://payloser.example"],
      ),
    ).toBe(true);
  });

  it("falls back to the referer origin for unsafe browser requests", () => {
    expect(
      isTrustedRequestOrigin(
        {
          method: "PATCH",
          headers: {
            referer: "https://payloser.example/groups/1",
          },
        },
        ["https://payloser.example"],
      ),
    ).toBe(true);
  });

  it("rejects unsafe methods with a missing or untrusted origin", () => {
    expect(
      isTrustedRequestOrigin(
        {
          method: "DELETE",
          headers: {},
        },
        ["https://payloser.example"],
      ),
    ).toBe(false);
    expect(
      isTrustedRequestOrigin(
        {
          method: "POST",
          headers: {
            origin: "https://attacker.example",
          },
        },
        ["https://payloser.example"],
      ),
    ).toBe(false);
  });

  it("responds with 403 instead of calling next for untrusted unsafe requests", () => {
    const next = jest.fn();
    const response = {
      statusCode: 200,
      setHeader: jest.fn(),
      end: jest.fn(),
    };

    requestOriginMiddleware(["https://payloser.example"])(
      {
        method: "POST",
        headers: {
          origin: "https://attacker.example",
        },
      },
      response,
      next,
    );

    expect(next).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(403);
    expect(response.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/json",
    );
  });

  it("reads comma-separated WEB_ORIGIN values", () => {
    process.env = {
      ...originalEnv,
      WEB_ORIGIN: "https://web.example, https://admin.example ",
    };

    expect(getTrustedOriginsFromEnv()).toEqual([
      "https://web.example",
      "https://admin.example",
    ]);
  });
});
