import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle, TouchableOpacity } from "react-native";
import { C } from "./theme";

// ─── PIXEL FONT ───────────────────────────────────────────────────────────────
export const PIXEL_FONT = "PressStart2P";

// ─── PIXEL TEXT ───────────────────────────────────────────────────────────────
type PxTextProps = {
  children: React.ReactNode;
  size?: number;
  color?: string;
  style?: TextStyle;
  numberOfLines?: number;
};

export function PxText({ children, size = 8, color = C.white, style, numberOfLines }: PxTextProps) {
  return (
    <Text
      style={[{ fontFamily: PIXEL_FONT, fontSize: size, color, lineHeight: size * 1.8 }, style]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
}

// ─── PIXEL BOX (chunky border) ────────────────────────────────────────────────
type PxBoxProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  borderColor?: string;
  bg?: string;
  padding?: number;
};

export function PxBox({ children, style, borderColor = C.border, bg = C.bgCard, padding = 8 }: PxBoxProps) {
  return (
    <View style={[pxBoxStyles.box, { borderColor, backgroundColor: bg, padding }, style]}>
      {children}
    </View>
  );
}

const pxBoxStyles = StyleSheet.create({
  box: {
    borderWidth: 2,
    borderRadius: 0, // pixel style = no rounding
  },
});

// ─── PIXEL BADGE ─────────────────────────────────────────────────────────────
type PxBadgeProps = {
  label: string;
  color?: string;
  bg?: string;
  size?: number;
};

export function PxBadge({ label, color = C.bg, bg = C.accent, size = 6 }: PxBadgeProps) {
  return (
    <View style={[badgeStyles.badge, { backgroundColor: bg }]}>
      <PxText size={size} color={color}>{label}</PxText>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
});

// ─── PIXEL DIVIDER ────────────────────────────────────────────────────────────
export function PxDivider({ color = C.border }: { color?: string }) {
  return <View style={{ height: 2, backgroundColor: color, marginVertical: 4 }} />;
}

// ─── PIXEL SECTION HEADER ─────────────────────────────────────────────────────
export function PxSectionHeader({ title, color = C.accent }: { title: string; color?: string }) {
  return (
    <View style={sectionStyles.row}>
      <View style={[sectionStyles.tick, { backgroundColor: color }]} />
      <PxText size={7} color={color} style={{ letterSpacing: 1 }}>{title}</PxText>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8, marginTop: 12 },
  tick: { width: 4, height: 14 },
});

// ─── PIXEL TIRE BADGE ─────────────────────────────────────────────────────────
const TIRE_COLOR: Record<string, string> = {
  S: C.soft,
  M: C.medium,
  H: C.hard,
  I: C.inter,
  W: C.wet,
};

export function TireBadge({ compound, age }: { compound: string; age: number | string }) {
  const col = TIRE_COLOR[compound] ?? C.white;
  return (
    <View style={[tireStyles.wrap, { borderColor: col }]}>
      <PxText size={7} color={col}>{compound}</PxText>
      <PxText size={5} color={C.greyDark}>{String(age)}</PxText>
    </View>
  );
}

const tireStyles = StyleSheet.create({
  wrap: {
    borderWidth: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    alignItems: "center",
    minWidth: 28,
  },
});

// ─── MINI SECTOR ──────────────────────────────────────────────────────────────
// Status: 0=none, 1=yellow(own best), 2=green(session best), 3=purple(fastest)
const SECTOR_COLORS = ["#2a2a2a", C.yellow, C.green, C.purple];

export function MiniSectors({ sectors }: { sectors: number[] }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {sectors.map((s, i) => (
        <View
          key={i}
          style={{ width: 10, height: 10, backgroundColor: SECTOR_COLORS[s] }}
        />
      ))}
    </View>
  );
}

// ─── POSITION CHANGE INDICATOR ────────────────────────────────────────────────
export function PosDelta({ delta }: { delta: number }) {
  if (delta === 0) return <PxText size={6} color={C.greyDark}>-</PxText>;
  const up = delta > 0;
  return (
    <PxText size={6} color={up ? C.green : C.accent}>
      {up ? "▲" : "▼"}{Math.abs(delta)}
    </PxText>
  );
}

// ─── PIXEL BUTTON ─────────────────────────────────────────────────────────────
type PxButtonProps = {
  label: string;
  onPress: () => void;
  active?: boolean;
  color?: string;
  size?: number;
};

export function PxButton({ label, onPress, active = false, color = C.accent, size = 7 }: PxButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[btnStyles.btn, { borderColor: color, backgroundColor: active ? color : "transparent" }]}
      activeOpacity={0.7}
    >
      <PxText size={size} color={active ? C.bg : color}>{label}</PxText>
    </TouchableOpacity>
  );
}

const btnStyles = StyleSheet.create({
  btn: {
    borderWidth: 2,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
});
