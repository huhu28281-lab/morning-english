import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "모닝 잉글리시 · 출근길 영어회화",
  description: "직장인을 위한 출근길 실전 초급 회화. 쉬운 문장을 연결해 이유를 설명하고, 업무를 요청하고, 두세 문장으로 답해보세요.",
  applicationName: "모닝 잉글리시",
  appleWebApp: { capable: true, title: "모닝 잉글리시", statusBarStyle: "default" },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = { themeColor: "#182e57" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" crossOrigin="use-credentials" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
