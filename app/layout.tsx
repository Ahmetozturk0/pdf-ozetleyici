import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PDF Summarizer — AI-Powered Document Insights",
  description: "Upload any PDF and get an AI-powered summary in seconds. Powered by Google Gemini.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
