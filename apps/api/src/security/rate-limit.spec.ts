import { rateLimitMiddleware } from "./rate-limit";

describe("rateLimitMiddleware", () => {
  it("allows requests under the limit", () => {
    const next = jest.fn();
    const response = createResponse();

    rateLimitMiddleware({
      now: () => 1_000,
      store: new Map(),
      windowMs: 60_000,
    })(
      {
        headers: {},
        method: "GET",
        url: "/groups",
      },
      response,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
    expect(response.end).not.toHaveBeenCalled();
  });

  it("blocks strict paths after their path-specific limit", () => {
    const middleware = rateLimitMiddleware({
      now: () => 1_000,
      store: new Map(),
      windowMs: 60_000,
    });
    const request = {
      headers: {
        "x-forwarded-for": "203.0.113.10",
      },
      method: "POST",
      url: "/auth/dev-login",
    };

    for (let index = 0; index < 10; index += 1) {
      middleware(request, createResponse(), jest.fn());
    }

    const next = jest.fn();
    const response = createResponse();
    middleware(request, response, next);

    expect(next).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(429);
    expect(response.setHeader).toHaveBeenCalledWith("Retry-After", "60");
  });

  it("resets the bucket after the window", () => {
    let now = 1_000;
    const middleware = rateLimitMiddleware({
      now: () => now,
      store: new Map(),
      windowMs: 10,
    });
    const request = {
      headers: {},
      method: "POST",
      url: "/auth/dev-login",
    };

    for (let index = 0; index < 10; index += 1) {
      middleware(request, createResponse(), jest.fn());
    }

    now = 1_011;
    const next = jest.fn();
    middleware(request, createResponse(), next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});

function createResponse() {
  return {
    statusCode: 200,
    setHeader: jest.fn(),
    end: jest.fn(),
  };
}
