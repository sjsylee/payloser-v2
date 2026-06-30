const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 240;
const STRICT_PATH_RULES: Array<{ maxRequests: number; pattern: RegExp }> = [
  { pattern: /^\/auth\/dev-login$/, maxRequests: 10 },
  { pattern: /^\/auth\/kakao\/start$/, maxRequests: 30 },
  { pattern: /^\/uploads\//, maxRequests: 30 },
  { pattern: /\/invitations(?:\/|$)/, maxRequests: 60 },
];

type RequestLike = {
  headers: Record<string, string | string[] | undefined>;
  method?: string;
  socket?: {
    remoteAddress?: string;
  };
  url?: string;
};

type ResponseLike = {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

export function rateLimitMiddleware(
  options: {
    now?: () => number;
    store?: Map<string, RateLimitBucket>;
    windowMs?: number;
  } = {},
) {
  const store = options.store ?? new Map<string, RateLimitBucket>();
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const now = options.now ?? Date.now;

  return (request: RequestLike, response: ResponseLike, next: () => void) => {
    const limit = getRequestLimit(request.url ?? "");
    const key = `${getClientIp(request)}:${request.method ?? "GET"}:${normalizePath(request.url ?? "/")}`;
    const currentTime = now();
    const bucket = getBucket({
      currentTime,
      key,
      store,
      windowMs,
    });

    bucket.count += 1;

    if (bucket.count > limit) {
      response.statusCode = 429;
      response.setHeader("Content-Type", "application/json");
      response.setHeader(
        "Retry-After",
        String(Math.max(1, Math.ceil((bucket.resetAt - currentTime) / 1000))),
      );
      response.end(JSON.stringify({ error: "rate limit exceeded" }));
      return;
    }

    next();
  };
}

function getBucket({
  currentTime,
  key,
  store,
  windowMs,
}: {
  currentTime: number;
  key: string;
  store: Map<string, RateLimitBucket>;
  windowMs: number;
}) {
  const existing = store.get(key);

  if (existing && existing.resetAt > currentTime) {
    return existing;
  }

  const next = {
    count: 0,
    resetAt: currentTime + windowMs,
  };
  store.set(key, next);

  return next;
}

function getRequestLimit(url: string) {
  const path = normalizePath(url);
  const strictRule = STRICT_PATH_RULES.find((rule) => rule.pattern.test(path));

  return strictRule?.maxRequests ?? DEFAULT_MAX_REQUESTS;
}

function getClientIp(request: RequestLike) {
  const forwardedFor = getHeaderValue(request.headers["x-forwarded-for"]);

  return (
    forwardedFor?.split(",")[0]?.trim() ||
    request.socket?.remoteAddress ||
    "unknown"
  );
}

function getHeaderValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizePath(url: string) {
  return url.split("?")[0] || "/";
}
