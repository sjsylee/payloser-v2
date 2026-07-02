"use client";

import { useLayoutEffect } from "react";

type SafeAreaChromeProps = {
  backgroundColor: string;
  bottomColor: string;
  themeColor?: string;
  topColor: string;
};

export function SafeAreaChrome({
  backgroundColor,
  bottomColor,
  themeColor,
  topColor,
}: SafeAreaChromeProps) {
  const nextThemeColor = themeColor ?? topColor;

  useLayoutEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    let themeMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );

    if (!themeMeta) {
      themeMeta = document.createElement("meta");
      themeMeta.name = "theme-color";
      document.head.appendChild(themeMeta);
    }

    themeMeta.content = nextThemeColor;
    root.style.backgroundColor = backgroundColor;
    body.style.backgroundColor = backgroundColor;
    root.style.setProperty("--payloser-safe-area-top", topColor);
    root.style.setProperty("--payloser-safe-area-bottom", bottomColor);
  }, [backgroundColor, bottomColor, nextThemeColor, topColor]);

  return (
    <style
      // Keep the iOS Safari chrome continuous before hydration catches up.
      dangerouslySetInnerHTML={{
        __html: `
html,body{background:${backgroundColor};}
:root{
  --payloser-safe-area-top:${topColor};
  --payloser-safe-area-bottom:${bottomColor};
}`,
      }}
    />
  );
}
