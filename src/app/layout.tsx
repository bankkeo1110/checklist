import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nhiệm Vụ & Điểm — Otis & Liam",
  description: "Bảng nhiệm vụ tuần và checklist trước khi ngủ của Otis và Liam",
  // iPhone "Add to Home Screen": open full-screen with its own name.
  appleWebApp: {
    capable: true,
    title: "Nhiệm Vụ",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#fff7ed",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
