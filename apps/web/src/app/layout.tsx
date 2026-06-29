import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Payloser",
  description: "Friend-group bowling settlement with stack-based payments.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
