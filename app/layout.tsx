import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "見積書・請求書作成ツール",
  description: "案件ごとの見積書・請求書をかんたんに作成・PDF出力できるツール",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
