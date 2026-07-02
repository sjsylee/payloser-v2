import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendKakaoTextShareResult } from "./kakao-share";

const originalJavascriptKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;

function setWindowKakao(kakao: unknown) {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { Kakao: kakao },
  });
}

function clearWindow() {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: undefined,
  });
}

describe("sendKakaoTextShareResult", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY = "test-javascript-key";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY = originalJavascriptKey;
    clearWindow();
    vi.restoreAllMocks();
  });

  it("calls Kakao.Share.sendDefault when the SDK is already ready in the tap path", async () => {
    const sendDefault = vi.fn();
    const kakao = {
      Share: { sendDefault },
      init: vi.fn(),
      isInitialized: vi.fn(() => true),
    };
    setWindowKakao(kakao);

    const result = await sendKakaoTextShareResult({
      buttonTitle: "초대장 열기",
      description: "같이 친 사람만 쏙 고릅니다.",
      title: "초대장이 왔어요",
      url: "https://payloser.example/invite/token",
    });

    expect(result).toEqual({ ok: true });
    expect(sendDefault).toHaveBeenCalledWith(
      expect.objectContaining({
        installTalk: true,
        objectType: "text",
        text: "초대장이 왔어요\n같이 친 사람만 쏙 고릅니다.",
      }),
    );
  });

  it("returns a missing-key reason instead of silently falling back", async () => {
    process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY = "";

    const result = await sendKakaoTextShareResult({
      buttonTitle: "초대장 열기",
      description: "같이 친 사람만 쏙 고릅니다.",
      title: "초대장이 왔어요",
      url: "https://payloser.example/invite/token",
    });

    expect(result).toEqual({ ok: false, reason: "missing-key" });
  });

  it("returns a send-failed reason when the Kakao SDK rejects the share call", async () => {
    const kakao = {
      Share: {
        sendDefault: vi.fn(() => {
          throw new Error("domain is not registered");
        }),
      },
      init: vi.fn(),
      isInitialized: vi.fn(() => true),
    };
    setWindowKakao(kakao);

    const result = await sendKakaoTextShareResult({
      buttonTitle: "초대장 열기",
      description: "같이 친 사람만 쏙 고릅니다.",
      title: "초대장이 왔어요",
      url: "https://payloser.example/invite/token",
    });

    expect(result).toEqual({
      message: "domain is not registered",
      ok: false,
      reason: "send-failed",
    });
  });
});
