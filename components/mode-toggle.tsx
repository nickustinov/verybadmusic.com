"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { buildTheme, isDark, skinOf } from "@/lib/theme";

/** Flips the light/dark axis while keeping the current skin. */
export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle light/dark"
      onClick={() => setTheme(buildTheme(skinOf(theme), !isDark(theme)))}
    >
      {/* CSS picks the icon from the active -dark class - no JS, no hydration flash. */}
      <Sun className="hidden dark:block" />
      <Moon className="block dark:hidden" />
    </Button>
  );
}
