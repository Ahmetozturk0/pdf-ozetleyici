import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PDF Özetleyici — Yapay Zeka ile Belge Analizi",
  description: "PDF belgelerinizi yükleyin ve saniyeler içinde yapay zeka destekli özetler alın. Google Gemini ile güçlendirilmiştir.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
