import { StyleSheet } from "react-native";
import { useMemo } from "react";
import { useSettingsStore } from "../store/useSettingsStore";

// ── Pixel Palette ────────────────────────────────────────────────
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

  // Tyre colours
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

  // Tyre colours
  soft: "#FF3333",
  medium: "#C6A100",
  hard: "#666666",
  inter: "#1e8f3c",
  wet: "#005fd1",
} as const;

// ── Team colours (keyed by name) ─────────────────────────────────
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

// ── Shared text styles ────────────────────────────────────────────
export const px = StyleSheet.create({
  h1: {
    fontFamily: "PressStart2P",
    fontSize: 12,
    color: C.white,
    lineHeight: 20,
  },
  h2: {
    fontFamily: "PressStart2P",
    fontSize: 9,
    color: C.white,
    lineHeight: 16,
  },
  h3: {
    fontFamily: "PressStart2P",
    fontSize: 7,
    color: C.white,
    lineHeight: 13,
  },
  label: {
    fontFamily: "PressStart2P",
    fontSize: 6,
    color: C.grey,
    lineHeight: 11,
    letterSpacing: 0.5,
  },
  mono: {
    fontFamily: "PressStart2P",
    fontSize: 7,
    color: C.white,
    lineHeight: 12,
  },
});

export type ThemeMode = "dark" | "light";
export type ScalePreset = "small" | "normal" | "large";
type Palette = Record<keyof typeof C, string>;

export function scaleForPreset(scale: ScalePreset): number {
  if (scale === "small") return 0.9;
  if (scale === "large") return 1.15;
  return 1;
}

export function paletteForMode(mode: ThemeMode): Palette {
  return mode === "light" ? LIGHT_C : C;
}

export function createPxTokens(scalePreset: ScalePreset, palette: Palette) {
  const s = scaleForPreset(scalePreset);
  return StyleSheet.create({
    h1: {
      fontFamily: "PressStart2P",
      fontSize: Math.round(12 * s),
      color: palette.white,
      lineHeight: Math.round(20 * s),
    },
    h2: {
      fontFamily: "PressStart2P",
      fontSize: Math.round(9 * s),
      color: palette.white,
      lineHeight: Math.round(16 * s),
    },
    h3: {
      fontFamily: "PressStart2P",
      fontSize: Math.round(7 * s),
      color: palette.white,
      lineHeight: Math.round(13 * s),
    },
    label: {
      fontFamily: "PressStart2P",
      fontSize: Math.round(6 * s),
      color: palette.grey,
      lineHeight: Math.round(11 * s),
      letterSpacing: 0.5,
    },
    mono: {
      fontFamily: "PressStart2P",
      fontSize: Math.round(7 * s),
      color: palette.white,
      lineHeight: Math.round(12 * s),
    },
  });
}

export function useThemeTokens() {
  const mode = useSettingsStore((s) => s.mode);
  const scalePreset = useSettingsStore((s) => s.scale);
  const color = useMemo(() => paletteForMode(mode), [mode]);
  const text = useMemo(() => createPxTokens(scalePreset, color), [scalePreset, color]);
  const scaleValue = scaleForPreset(scalePreset);
  const statusBarStyle: "light-content" | "dark-content" = mode === "dark" ? "light-content" : "dark-content";
  return { C: color, px: text, mode, scalePreset, scaleValue, statusBarStyle };
}
