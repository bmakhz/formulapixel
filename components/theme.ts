import { StyleSheet } from "react-native";

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
