const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const DEFAULT_TRUSTED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3002",
];

type RequestOriginHeaders = Record<string, string | string[] | undefined>;

type RequestLike = {
  method?: string;
  headers: RequestOriginHeaders;
};

type ResponseLike = {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
};

export function requestOriginMiddleware(
  trustedOrigins = getTrustedOriginsFromEnv(),
) {
  return (request: RequestLike, response: ResponseLike, next: () => void) => {
    if (isTrustedRequestOrigin(request, trustedOrigins)) {
      next();
      return;
    }

    response.statusCode = 403;
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ error: "untrusted request origin" }));
  };
}

export function isTrustedRequestOrigin(
  request: RequestLike,
  trustedOrigins = getTrustedOriginsFromEnv(),
) {
  const method = request.method?.toUpperCase() ?? "GET";

  if (SAFE_METHODS.has(method)) {
    return true;
  }

  const requestOrigin = extractRequestOrigin(request.headers);

  return requestOrigin ? trustedOrigins.includes(requestOrigin) : false;
}

export function getTrustedOriginsFromEnv() {
  const configuredOrigins = process.env.WEB_ORIGIN?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return configuredOrigins?.length
    ? configuredOrigins
    : DEFAULT_TRUSTED_ORIGINS;
}

function extractRequestOrigin(headers: RequestOriginHeaders) {
  const origin = getHeaderValue(headers.origin);

  if (origin) {
    return normalizeOrigin(origin);
  }

  const referer = getHeaderValue(headers.referer);

  return referer ? normalizeOrigin(referer) : null;
}

function getHeaderValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

function normalizeOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}
