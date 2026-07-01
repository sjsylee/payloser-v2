"use client";

import { useEffect, useState } from "react";
import { sendKakaoTextShare } from "@/shared/kakao/kakao-share";

export function useSettlementShare({
  groupName,
  shareText,
  shareUrl,
}: {
  groupName?: string | undefined;
  shareText: string;
  shareUrl?: string | null | undefined;
}) {
  const [shareCopied, setShareCopied] = useState(false);
  const [sharePreviewText, setSharePreviewText] = useState<string | null>(null);
  const shareMessage = buildSettlementShareMessage({ shareText, shareUrl });

  useEffect(() => {
    setSharePreviewText(null);
  }, [shareMessage]);

  const copyShareText = async () => {
    if (!shareMessage) {
      return;
    }

    setSharePreviewText(shareMessage);

    try {
      await navigator.clipboard.writeText(shareMessage);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 1400);
    } catch {
      setShareCopied(false);
    }
  };

  const shareWithKakao = async () => {
    if (!shareMessage) {
      return;
    }

    setSharePreviewText(shareMessage);

    try {
      const url = shareUrl ?? window.location.href;
      const shared = await sendKakaoTextShare({
        buttonTitle: "정산 확인하기",
        description: shareUrl
          ? "송금 목록과 계산 근거를 링크에서 확인해요."
          : shareText,
        title: `${groupName ?? "Payloser"} 정산표`,
        url,
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

function buildSettlementShareMessage({
  shareText,
  shareUrl,
}: {
  shareText: string;
  shareUrl?: string | null | undefined;
}) {
  if (!shareText) {
    return "";
  }

  return shareUrl ? `${shareText}\n\n계산 근거 ${shareUrl}` : shareText;
}
