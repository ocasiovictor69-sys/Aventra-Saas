import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aventra - Real Estate Operations | TomorrowNow AI",
  description: "Aventra: Next-gen real estate operations and autonomous management systems. Portfolio & compliance management at scale.",
  keywords: ["real estate", "property management", "compliance", "autonomous operations", "portfolio management"],
  authors: [{ name: "TomorrowNow AI" }],
  openGraph: {
    title: "Aventra - Real Estate Operations",
    description: "Next-gen real estate operations and autonomous management systems.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
