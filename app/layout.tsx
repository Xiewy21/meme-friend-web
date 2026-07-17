import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "梗友 — 朋友专属表情包生成器",
  description: "输入一句话或上传照片，几秒生成融合今日热梗的朋友专属表情包。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
