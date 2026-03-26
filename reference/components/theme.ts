import { StyleSheet } from "react-native";

// ── Pixel Palette ──────────────────────────────────────────────
export const C = {
  bg:        "#0d0d0d",
  bgPanel:   "#111111",
  bgCard:    "#161616",
  border:    "#2a2a2a",
  borderBright: "#444444",
  accent:    "#e8002d",
  accentDim: "#7a0018",
  green:     "#39ff14",
  greenDim:  "#1a7a00",
  yellow:    "#ffe600",
  yellowDim: "#7a6e00",
  purple:    "#cc00ff",
  cyan:      "#00eeff",
  white:     "#e8e8e8",
  grey:      "#888888",
  greyDark:  "#444444",
  black:     "#000000",

  // Team colours
  redbull:      "#3671C6",
  ferrari:      "#E8002D",
  mercedes:     "#27F4D2",
  mclaren:      "#FF8000",
  astonmartin:  "#229971",
  alpine:       "#FF87BC",
  williams:     "#64C4FF",
  rb:           "#6692FF",
  haas:         "#B6BABD",
  sauber:       "#52E252",

  // Tyre colours
  soft:   "#FF3333",
  medium: "#FFE600",
  hard:   "#DDDDDD",
  inter:  "#39B54A",
  wet:    "#0067FF",
};

export const TEAM_COLORS: Record<string, string> = {
  "Red Bull":    C.redbull,
  Ferrari:       C.ferrari,
  Mercedes:      C.mercedes,
  McLaren:       C.mclaren,
  "Aston Martin": C.astonmartin,
  Alpine:        C.alpine,
  Williams:      C.williams,
  RB:            C.rb,
  Haas:          C.haas,
  Sauber:        C.sauber,
};

export const TIRE_COLORS: Record<string, string> = {
  S: C.soft,
  M: C.medium,
  H: C.hard,
  I: C.inter,
  W: C.wet,
};

// ── Pixel border helper ────────────────────────────────────────
// Simulates chunky 2-px pixel border with shadow offset
export const pixelBorder = (color = C.border, width = 2) => ({
  borderWidth: width,
  borderColor: color,
  borderRadius: 0, // pixel style = no radius
});

export const pixelShadow = (color = "#000") => ({
  shadowColor: color,
  shadowOffset: { width: 3, height: 3 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 4,
});

// ── Shared text styles ─────────────────────────────────────────
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
  accent: {
    fontFamily: "PressStart2P",
    fontSize: 7,
    color: C.accent,
    lineHeight: 12,
  },
  green: {
    fontFamily: "PressStart2P",
    fontSize: 7,
    color: C.green,
    lineHeight: 12,
  },
  yellow: {
    fontFamily: "PressStart2P",
    fontSize: 7,
    color: C.yellow,
    lineHeight: 12,
  },
});
