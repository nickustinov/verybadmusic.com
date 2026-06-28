"use client";

import * as React from "react";
import { useTheme } from "next-themes";

import { DEFAULT_THEME, type Skin, skinOf } from "@/lib/theme";

/** Active skin, SSR-safe: returns the default until mounted to avoid mismatch. */
export function useSkin(): Skin {
  const { theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return skinOf(mounted ? theme : DEFAULT_THEME);
}
