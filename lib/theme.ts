/**
 * Theming model: a skin (typography) is orthogonal to light/dark. next-themes
 * stores a single string, so we encode the two axes as `<skin>` (light) or
 * `<skin>-dark`. These helpers split/join that string; the skin picker and the
 * light/dark toggle each change one axis while preserving the other.
 */

export const SKINS = [
  { key: "terminal", label: "terminal" },
  { key: "editorial", label: "editorial" },
  { key: "cassette", label: "cassette" },
  { key: "manga", label: "manga" },
  { key: "winamp", label: "winamp" },
  { key: "pacman", label: "pac-man" },
  { key: "matrix", label: "matrix" },
  { key: "gameboy", label: "gameboy" },
] as const;

export type Skin = (typeof SKINS)[number]["key"];

export const THEMES = SKINS.flatMap((s) => [s.key, `${s.key}-dark`]);

export const DEFAULT_THEME = "cassette";

export function isDark(theme: string | undefined): boolean {
  return !!theme?.endsWith("-dark");
}

export function skinOf(theme: string | undefined): Skin {
  if (!theme) return "terminal";
  const base = isDark(theme) ? theme.slice(0, -"-dark".length) : theme;
  return (SKINS.find((s) => s.key === base)?.key ?? "terminal") as Skin;
}

export function buildTheme(skin: string, dark: boolean): string {
  return dark ? `${skin}-dark` : skin;
}
