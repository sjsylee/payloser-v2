import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";

const KAKAO_AUTHORIZE_URL = "https://kauth.kakao.com/oauth/authorize";
const KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token";
const KAKAO_USER_ME_URL = "https://kapi.kakao.com/v2/user/me";

type KakaoTokenResponse = {
  access_token?: unknown;
};

type KakaoProfileResponse = {
  id?: unknown;
  kakao_account?: {
    profile_nickname_needs_agreement?: unknown;
    profile_image_needs_agreement?: unknown;
    profile?: {
      nickname?: unknown;
      profile_image_url?: unknown;
      thumbnail_image_url?: unknown;
    };
  };
  properties?: {
    nickname?: unknown;
    profile_image?: unknown;
    thumbnail_image?: unknown;
  };
};

export interface KakaoProfile {
  kakaoId: string;
  nickname: string | null;
  profileImageUrl: string | null;
}

@Injectable()
export class KakaoOAuthProvider {
  createAuthorizationUrl(state: string) {
    const url = new URL(KAKAO_AUTHORIZE_URL);

    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", getKakaoRestApiKey());
    url.searchParams.set("redirect_uri", getKakaoRedirectUri());
    url.searchParams.set("state", state);
    url.searchParams.set("scope", "profile_nickname,profile_image");

    return url.toString();
  }

  async exchangeCodeForProfile(code: string): Promise<KakaoProfile> {
    const token = await this.exchangeToken(code);

    return this.fetchProfile(token.accessToken);
  }

  private async exchangeToken(code: string) {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: getKakaoRestApiKey(),
      redirect_uri: getKakaoRedirectUri(),
      code,
    });
    const clientSecret = process.env.KAKAO_CLIENT_SECRET;

    if (clientSecret) {
      body.set("client_secret", clientSecret);
    }

    const response = await fetch(KAKAO_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
      body,
    });

    if (!response.ok) {
      throw new UnauthorizedException("Kakao token request failed.");
    }

    const token = (await response.json()) as KakaoTokenResponse;

    if (typeof token.access_token !== "string") {
      throw new UnauthorizedException("Kakao access token was not issued.");
    }

    return {
      accessToken: token.access_token,
    };
  }

  private async fetchProfile(accessToken: string): Promise<KakaoProfile> {
    const response = await fetch(KAKAO_USER_ME_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new UnauthorizedException("Kakao profile request failed.");
    }

    const profile = (await response.json()) as KakaoProfileResponse;
    const accountProfile = profile.kakao_account?.profile;
    const properties = profile.properties;

    return {
      kakaoId: normalizeKakaoId(profile.id),
      nickname:
        toOptionalString(accountProfile?.nickname) ??
        toOptionalString(properties?.nickname),
      profileImageUrl:
        toOptionalString(accountProfile?.profile_image_url) ??
        toOptionalString(accountProfile?.thumbnail_image_url) ??
        toOptionalString(properties?.profile_image) ??
        toOptionalString(properties?.thumbnail_image) ??
        null,
    };
  }
}

function getKakaoRestApiKey() {
  const value = process.env.KAKAO_REST_API_KEY ?? process.env.KAKAO_CLIENT_ID;

  if (!value) {
    throw new ServiceUnavailableException(
      "KAKAO_REST_API_KEY is not configured.",
    );
  }

  return value;
}

function getKakaoRedirectUri() {
  return (
    process.env.KAKAO_REDIRECT_URI ??
    "http://localhost:3001/auth/kakao/callback"
  );
}

function normalizeKakaoId(id: unknown) {
  if (typeof id === "number" || typeof id === "string") {
    return String(id);
  }

  throw new UnauthorizedException("Kakao profile did not include a user id.");
}

function toOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
