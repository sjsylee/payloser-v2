"use client";

const KAKAO_SDK_SRC = "https://t1.kakaocdn.net/kakao_js_sdk/2.8.1/kakao.min.js";
const KAKAO_SDK_LOAD_TIMEOUT_MS = 5000;

type KakaoShareLink = {
  mobileWebUrl: string;
  webUrl: string;
};

type KakaoShareInput = {
  buttonTitle: string;
  description: string;
  title: string;
  url: string;
};

export type KakaoShareFailureReason =
  | "init-failed"
  | "missing-key"
  | "sdk-load-failed"
  | "sdk-unavailable"
  | "send-failed"
  | "share-unavailable";

export type KakaoShareResult =
  | { ok: true }
  | { message?: string; ok: false; reason: KakaoShareFailureReason };

type KakaoSdk = {
  Share?: {
    sendDefault: (input: {
      buttons: Array<{ link: KakaoShareLink; title: string }>;
      installTalk?: boolean;
      link: KakaoShareLink;
      objectType: "text";
      text: string;
    }) => void;
  };
  init: (key: string) => void;
  isInitialized: () => boolean;
};

declare global {
  interface Window {
    Kakao?: KakaoSdk;
  }
}

let sdkLoadPromise: Promise<KakaoSdk> | null = null;

function getJavascriptKey() {
  return process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY?.trim() ?? "";
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : undefined;
}

function kakaoShareFailure(
  reason: KakaoShareFailureReason,
  error?: unknown,
): KakaoShareResult {
  const message = getErrorMessage(error);

  return message ? { message, ok: false, reason } : { ok: false, reason };
}

function reportKakaoShareFailure(result: KakaoShareResult) {
  if (result.ok || process.env.NODE_ENV === "production") {
    return;
  }

  // KR: 카카오 공유가 URL 복사 fallback으로 내려간 정확한 이유를 개발 중에만 남긴다.
  // EN: Keep the exact Kakao-share fallback reason visible during development only.
  console.warn("[payloser:kakao-share]", result.reason, result.message ?? "");
}

function loadKakaoSdk() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Kakao SDK is only available in browser"));
  }

  if (window.Kakao) {
    return Promise.resolve(window.Kakao);
  }

  if (sdkLoadPromise) {
    return sdkLoadPromise;
  }

  sdkLoadPromise = new Promise<KakaoSdk>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${KAKAO_SDK_SRC}"]`,
    );
    const timeoutId = window.setTimeout(() => {
      reject(new Error("Kakao SDK load timed out"));
    }, KAKAO_SDK_LOAD_TIMEOUT_MS);

    const finish = (callback: () => void) => {
      window.clearTimeout(timeoutId);
      callback();
    };

    const handleLoad = () => {
      if (!window.Kakao) {
        finish(() => reject(new Error("Kakao SDK did not initialize")));
        return;
      }

      finish(() => resolve(window.Kakao as KakaoSdk));
    };

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad, { once: true });
      existingScript.addEventListener(
        "error",
        () => finish(() => reject(new Error("Failed to load Kakao SDK"))),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = KAKAO_SDK_SRC;
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener(
      "error",
      () => finish(() => reject(new Error("Failed to load Kakao SDK"))),
      { once: true },
    );
    document.head.appendChild(script);
  }).catch((error) => {
    sdkLoadPromise = null;
    throw error;
  });

  return sdkLoadPromise;
}

async function getReadyKakaoShare(): Promise<
  KakaoShareResult & { kakao?: KakaoSdk }
> {
  const key = getJavascriptKey();

  if (!key) {
    return kakaoShareFailure("missing-key");
  }

  let kakao: KakaoSdk;

  try {
    kakao = await loadKakaoSdk();
  } catch (error) {
    return kakaoShareFailure("sdk-load-failed", error);
  }

  try {
    if (!kakao.isInitialized()) {
      kakao.init(key);
    }
  } catch (error) {
    return kakaoShareFailure("init-failed", error);
  }

  if (!kakao.Share) {
    return kakaoShareFailure("share-unavailable");
  }

  return { kakao, ok: true };
}

function getReadyKakaoShareSync(): KakaoShareResult & { kakao?: KakaoSdk } {
  if (typeof window === "undefined") {
    return kakaoShareFailure("sdk-unavailable");
  }

  const key = getJavascriptKey();
  const kakao = window.Kakao;

  if (!key) {
    return kakaoShareFailure("missing-key");
  }

  if (!kakao) {
    return kakaoShareFailure("sdk-unavailable");
  }

  try {
    if (!kakao.isInitialized()) {
      kakao.init(key);
    }
  } catch (error) {
    return kakaoShareFailure("init-failed", error);
  }

  if (!kakao.Share) {
    return kakaoShareFailure("share-unavailable");
  }

  return { kakao, ok: true };
}

export async function preloadKakaoShare() {
  const result = await getReadyKakaoShare();
  reportKakaoShareFailure(result);
  return result.ok;
}

function sendDefaultTextShare(
  kakao: KakaoSdk,
  input: KakaoShareInput,
): KakaoShareResult {
  const link = {
    mobileWebUrl: input.url,
    webUrl: input.url,
  };

  try {
    kakao.Share?.sendDefault({
      objectType: "text",
      text: `${input.title}\n${input.description}`,
      link,
      installTalk: true,
      buttons: [
        {
          title: input.buttonTitle,
          link,
        },
      ],
    });
  } catch (error) {
    return kakaoShareFailure("send-failed", error);
  }

  return { ok: true };
}

export async function sendKakaoTextShareResult(
  input: KakaoShareInput,
): Promise<KakaoShareResult> {
  const readyKakao = getReadyKakaoShareSync();

  if (readyKakao.ok && readyKakao.kakao) {
    return sendDefaultTextShare(readyKakao.kakao, input);
  }

  const readyKakaoAsync = await getReadyKakaoShare();

  if (!readyKakaoAsync.ok || !readyKakaoAsync.kakao) {
    return readyKakaoAsync;
  }

  return sendDefaultTextShare(readyKakaoAsync.kakao, input);
}

export async function sendKakaoTextShare(input: KakaoShareInput) {
  const result = await sendKakaoTextShareResult(input);
  reportKakaoShareFailure(result);
  return result.ok;
}

export function isKakaoShareConfigured() {
  return Boolean(getJavascriptKey());
}
