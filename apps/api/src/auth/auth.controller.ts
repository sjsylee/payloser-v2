import { randomUUID } from "node:crypto";
import { Body, Controller, Get, Post, Query, Req, Res } from "@nestjs/common";
import { SESSION_COOKIE_NAME } from "./auth.constants";
import { AuthService } from "./auth.service";
import { DevLoginBodySchema } from "./auth.schemas";

const KAKAO_OAUTH_STATE_COOKIE_NAME = "payloser_kakao_oauth_state";
const KAKAO_OAUTH_RETURN_TO_COOKIE_NAME = "payloser_kakao_oauth_return_to";
const OAUTH_STATE_COOKIE_MAX_AGE_MS = 10 * 60 * 1000;

export interface CookieRequest {
  cookies?: Record<string, string | undefined>;
}

export interface CookieResponse {
  cookie(name: string, value: string, options: Record<string, unknown>): void;
  clearCookie?(name: string, options: Record<string, unknown>): void;
  redirect?(url: string): void;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("dev-login")
  async devLogin(
    @Body() body: unknown,
    @Res({ passthrough: true }) response: CookieResponse,
  ) {
    const input = DevLoginBodySchema.parse(body);
    const session = await this.authService.createDevSession(input);

    setSessionCookie(response, session.sessionToken);

    return {
      user: session.user,
    };
  }

  @Post("logout")
  async logout(
    @Req() request: CookieRequest,
    @Res({ passthrough: true }) response: CookieResponse,
  ) {
    await this.authService.revokeSession(
      request.cookies?.[SESSION_COOKIE_NAME],
    );
    clearSessionCookie(response);
    clearKakaoStateCookie(response);

    return {
      ok: true,
    };
  }

  @Get("kakao/start")
  startKakaoLogin(
    @Query("returnTo") returnToOrResponse: string | CookieResponse | undefined,
    @Res() responseArg?: CookieResponse,
  ) {
    const response =
      responseArg ?? (returnToOrResponse as CookieResponse | undefined);
    const returnTo = responseArg ? returnToOrResponse : undefined;
    const state = randomUUID();
    const normalizedReturnTo = normalizeReturnTo(returnTo);

    if (!response) {
      return;
    }

    try {
      response.cookie(KAKAO_OAUTH_STATE_COOKIE_NAME, state, {
        ...getCookieBaseOptions(),
        maxAge: OAUTH_STATE_COOKIE_MAX_AGE_MS,
      });

      if (normalizedReturnTo) {
        response.cookie(KAKAO_OAUTH_RETURN_TO_COOKIE_NAME, normalizedReturnTo, {
          ...getCookieBaseOptions(),
          maxAge: OAUTH_STATE_COOKIE_MAX_AGE_MS,
        });
      }

      response.redirect?.(this.authService.createKakaoAuthorizationUrl(state));
    } catch {
      clearKakaoStateCookie(response);
      clearKakaoReturnToCookie(response);
      response.redirect?.(
        buildWebRedirectUrl(
          buildQueryString({
            authError: "kakao_not_configured",
          }),
        ),
      );
    }
  }

  @Get("kakao/callback")
  async completeKakaoLogin(
    @Query("code") code: string | undefined,
    @Query("state") state: string | undefined,
    @Query("error") error: string | undefined,
    @Req() request: CookieRequest,
    @Res() response: CookieResponse,
  ) {
    clearKakaoStateCookie(response);
    const returnTo = normalizeReturnTo(
      request.cookies?.[KAKAO_OAUTH_RETURN_TO_COOKIE_NAME],
    );
    clearKakaoReturnToCookie(response);

    if (error || !code || !state) {
      response.redirect?.(
        buildWebRedirectUrl(
          buildQueryString({ authError: "kakao_denied" }),
          returnTo,
        ),
      );
      return;
    }

    if (request.cookies?.[KAKAO_OAUTH_STATE_COOKIE_NAME] !== state) {
      response.redirect?.(
        buildWebRedirectUrl(
          buildQueryString({ authError: "state_mismatch" }),
          returnTo,
        ),
      );
      return;
    }

    try {
      const session = await this.authService.createKakaoSession(code);

      setSessionCookie(response, session.sessionToken);
      response.redirect?.(buildWebRedirectUrl(undefined, returnTo));
    } catch {
      response.redirect?.(
        buildWebRedirectUrl(
          buildQueryString({ authError: "kakao_failed" }),
          returnTo,
        ),
      );
    }
  }

  @Get("me")
  async getMe(@Req() request: CookieRequest) {
    const token = request.cookies?.[SESSION_COOKIE_NAME];
    return this.authService.getSessionUser(token);
  }
}

function setSessionCookie(response: CookieResponse, sessionToken: string) {
  response.cookie(SESSION_COOKIE_NAME, sessionToken, getCookieBaseOptions());
}

function clearKakaoStateCookie(response: CookieResponse) {
  response.clearCookie?.(KAKAO_OAUTH_STATE_COOKIE_NAME, {
    path: "/",
  });
}

function clearKakaoReturnToCookie(response: CookieResponse) {
  response.clearCookie?.(KAKAO_OAUTH_RETURN_TO_COOKIE_NAME, {
    path: "/",
  });
}

function clearSessionCookie(response: CookieResponse) {
  response.clearCookie?.(SESSION_COOKIE_NAME, {
    path: "/",
  });
}

function getCookieBaseOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

function buildWebRedirectUrl(query?: string, returnTo?: string | null) {
  const webOrigin =
    process.env.KAKAO_LOGIN_SUCCESS_REDIRECT_URL ??
    process.env.WEB_APP_URL ??
    process.env.WEB_ORIGIN?.split(",")[0] ??
    "http://localhost:3002";
  const path = normalizeReturnTo(returnTo) ?? "/";

  if (path === "/") {
    return query ? `${webOrigin}?${query}` : webOrigin;
  }

  const baseUrl = new URL(path, webOrigin);

  if (query) {
    const searchParams = new URLSearchParams(query);

    for (const [key, value] of searchParams.entries()) {
      baseUrl.searchParams.set(key, value);
    }
  }

  return baseUrl.toString();
}

function buildQueryString(params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  return searchParams.toString();
}

function normalizeReturnTo(returnTo: unknown) {
  if (typeof returnTo !== "string") {
    return null;
  }

  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return null;
  }

  return returnTo;
}
