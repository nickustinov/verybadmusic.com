"use client";

import Link from "next/link";

import { ModeToggle } from "./mode-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-3 sm:px-4">
        <Link
          href="/"
          className="terminal-caret font-mono text-sm font-semibold lowercase tracking-tight"
        >
          verybadmusic
        </Link>
        <nav className="flex items-center gap-1">
          <ModeToggle />
        </nav>
      </div>
    </header>
  );
}
