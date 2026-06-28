"use client";

import Link from "next/link";
import { Github } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

import { ModeToggle } from "./mode-toggle";

const REPO_URL = "https://github.com/nickustinov/verybadmusic.com";

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
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Source on GitHub"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <Github />
          </a>
          <ModeToggle />
        </nav>
      </div>
    </header>
  );
}
