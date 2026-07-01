"use client";

const KAKAO_SDK_SRC = "https://t1.kakaocdn.net/kakao_js_sdk/2.8.1/kakao.min.js";

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

    const handleLoad = () => {
      if (!window.Kakao) {
        reject(new Error("Kakao SDK did not initialize"));
        return;
      }

      resolve(window.Kakao);
    };

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad, { once: true });
      existingScript.addEventListener("error", () => reject(), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = KAKAO_SDK_SRC;
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Failed to load Kakao SDK")),
      { once: true },
    );
    document.head.appendChild(script);
  });

  return sdkLoadPromise;
}

export async function sendKakaoTextShare(input: KakaoShareInput) {
  const key = getJavascriptKey();

  if (!key) {
    return false;
  }

  const kakao = await loadKakaoSdk();

  if (!kakao.isInitialized()) {
    kakao.init(key);
  }

  if (!kakao.Share) {
    return false;
  }

  const link = {
    mobileWebUrl: input.url,
    webUrl: input.url,
  };

  kakao.Share.sendDefault({
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

  return true;
}

export function isKakaoShareConfigured() {
  return Boolean(getJavascriptKey());
}
