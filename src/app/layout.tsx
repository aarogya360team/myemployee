import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans } from "next/font/google";
import { BRAND } from "@/lib/brand";
import { USP_DESCRIPTION, USP_PRIMARY } from "@/lib/usp/positioning";
import "./globals.css";

const notoSans = Noto_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin", "devanagari"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${BRAND.name} — ${USP_PRIMARY}`,
  description: USP_DESCRIPTION,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${notoSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className={`${notoSans.className} min-h-full flex flex-col`}>{children}</body>
    </html>
  );
}
