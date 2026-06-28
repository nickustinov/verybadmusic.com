"use client";

import * as React from "react";
import { useTheme } from "next-themes";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buildTheme, DEFAULT_THEME, isDark, SKINS, skinOf } from "@/lib/theme";

const LABELS: Record<string, string> = Object.fromEntries(
  SKINS.map((s) => [s.key, s.label]),
);

/** Picks the skin (typography) while keeping the current light/dark mode. */
export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Always a defined value (controlled from first render); the SSR/first-client
  // render uses the default skin and only updates once mounted.
  const skin = skinOf(mounted ? theme : DEFAULT_THEME);

  return (
    <Select
      value={skin}
      onValueChange={(v) => v && setTheme(buildTheme(v, isDark(theme)))}
    >
      <SelectTrigger size="sm" aria-label="Theme" className="font-mono lowercase">
        <SelectValue>{(v) => LABELS[v as string] ?? "theme"}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {SKINS.map((s) => (
          <SelectItem key={s.key} value={s.key} className="font-mono lowercase">
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
