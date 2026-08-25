import type { CSSProperties } from "react";
import { useMemo } from "react";
import { useSettingsStore } from "./store/useSettingsStore";

// ── Pixel Palette ────────────────────────────────────────────────
// Ported 1:1 from f1-live/components/theme.ts
export const C = {
  bg: "#0d0d0d",
  bgPanel: "#111111",
  bgCard: "#161616",
  border: "#2a2a2a",
  borderBright: "#444444",
  accent: "#e8002d",
  accentDim: "#7a0018",
  green: "#39ff14",
  greenDim: "#1a7a00",
  yellow: "#ffe600",
  yellowDim: "#7a6e00",
  purple: "#cc00ff",
  cyan: "#00eeff",
  white: "#e8e8e8",
  grey: "#888888",
  greyDark: "#444444",
  black: "#000000",

  soft: "#FF3333",
  medium: "#FFE600",
  hard: "#DDDDDD",
  inter: "#39B54A",
  wet: "#0067FF",
} as const;

const LIGHT_C = {
  bg: "#f7f7f5",
  bgPanel: "#ecece8",
  bgCard: "#ffffff",
  border: "#d0d0c8",
  borderBright: "#9b9b92",
  accent: "#d6002a",
  accentDim: "#6a0013",
  green: "#008a2a",
  greenDim: "#2f6d3a",
  yellow: "#9b7a00",
  yellowDim: "#6e5f00",
  purple: "#8b00b5",
  cyan: "#007f93",
  white: "#121212",
  grey: "#4d4d4d",
  greyDark: "#7b7b7b",
  black: "#000000",

  soft: "#FF3333",
  medium: "#C6A100",
  hard: "#666666",
  inter: "#1e8f3c",
  wet: "#005fd1",
} as const;

export const TEAM_COLORS: Record<string, string> = {
  "Red Bull": "#3671C6",
  Ferrari: "#E8002D",
  Mercedes: "#27F4D2",
  McLaren: "#FF8000",
  "Aston Martin": "#229971",
  Alpine: "#FF87BC",
  Williams: "#64C4FF",
  RB: "#6692FF",
  Haas: "#B6BABD",
  Sauber: "#52E252",
  "Kick Sauber": "#52E252",
};

export type ThemeMode = "dark" | "light";
export type ScalePreset = "small" | "medium" | "large";
export type Palette = Record<keyof typeof C, string>;

export function scaleForPreset(scale: ScalePreset): number {
  if (scale === "large") return 1.3;
  if (scale === "medium") return 1.15;
  return 1; // small
}

export function paletteForMode(mode: ThemeMode): Palette {
  return mode === "light" ? LIGHT_C : C;
}

const FONT = '"PressStart2P", monospace';

export function createPxTokens(scalePreset: ScalePreset, palette: Palette) {
  const s = scaleForPreset(scalePreset);
  const r = (n: number) => Math.round(n * s);
  return {
    h1: { fontFamily: FONT, fontSize: r(12), color: palette.white, lineHeight: `${r(20)}px` } as CSSProperties,
    h2: { fontFamily: FONT, fontSize: r(9), color: palette.white, lineHeight: `${r(16)}px` } as CSSProperties,
    h3: { fontFamily: FONT, fontSize: r(7), color: palette.white, lineHeight: `${r(13)}px` } as CSSProperties,
    label: { fontFamily: FONT, fontSize: r(6), color: palette.grey, lineHeight: `${r(11)}px`, letterSpacing: 0.5 } as CSSProperties,
    mono: { fontFamily: FONT, fontSize: r(7), color: palette.white, lineHeight: `${r(12)}px` } as CSSProperties,
  };
}

export type PxTokens = ReturnType<typeof createPxTokens>;

// Scale is fixed at "medium" — there's no user-facing option to change it
// (removed from Settings). Kept as a named preset rather than a bare number
// so createPxTokens/scaleForPreset's shape is unchanged.
const FIXED_SCALE: ScalePreset = "medium";

export function useThemeTokens() {
  const mode = useSettingsStore((s) => s.mode);
  const C_ = useMemo(() => paletteForMode(mode), [mode]);
  const px = useMemo(() => createPxTokens(FIXED_SCALE, C_), [C_]);
  const scaleValue = scaleForPreset(FIXED_SCALE);
  return { C: C_, px, mode, scalePreset: FIXED_SCALE, scaleValue };
}
