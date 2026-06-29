"use client";

import { useEffect, useState } from "react";
import { sendKakaoTextShare } from "@/shared/kakao/kakao-share";

export function useSettlementShare(shareText: string, groupName?: string) {
  const [shareCopied, setShareCopied] = useState(false);
  const [sharePreviewText, setSharePreviewText] = useState<string | null>(null);

  useEffect(() => {
    setSharePreviewText(null);
  }, [shareText]);

  const copyShareText = async () => {
    if (!shareText) {
      return;
    }

    setSharePreviewText(shareText);

    try {
      await navigator.clipboard.writeText(shareText);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 1400);
    } catch {
      setShareCopied(false);
    }
  };

  const shareWithKakao = async () => {
    if (!shareText) {
      return;
    }

    setSharePreviewText(shareText);

    try {
      const shared = await sendKakaoTextShare({
        buttonTitle: "정산 확인하기",
        description: shareText,
        title: `${groupName ?? "Payloser"} 정산표`,
        url: window.location.href,
      });

      if (!shared) {
        await copyShareText();
      }
    } catch {
      await copyShareText();
    }
  };

  return {
    copyShareText,
    shareCopied,
    sharePreviewText,
    shareWithKakao,
  };
}
