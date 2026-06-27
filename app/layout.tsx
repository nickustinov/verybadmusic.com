import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { PlayerDock } from "@/components/player/player-dock";
import { PlayerProvider } from "@/components/player/player-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

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
  title: "verybadmusic",
  description: "A web player for very bad music. DJ sets, streamed.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PlayerProvider>
            {children}
            <PlayerDock />
            <Toaster position="top-center" />
          </PlayerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
