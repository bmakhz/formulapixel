import { NavLink } from "react-router-dom";
import { View } from "./primitives";
import { useThemeTokens } from "../theme";
import { useActiveRaceSession, getRaceStatus } from "../hooks/useOpenF1";
import { sx } from "../utils/sx";

// Ported from f1-live/app/(tabs)/_layout.tsx — expo-router's <Tabs> becomes
// react-router <NavLink>s; pixel glyphs are identical (same 7×7 patterns).

const ICONS: Record<string, string[]> = {
  home: [
    "...#...",
    "..###..",
    ".#####.",
    "#######",
    "#.....#",
    "#.###.#",
    "#.###.#",
  ],
  live: [
    "##.....",
    "####...",
    "######.",
    "#######",
    "######.",
    "####...",
    "##.....",
  ],
  standings: [
    "#######",
    "#.....#",
    "#.....#",
    ".#####.",
    "...#...",
    "..###..",
    ".#####.",
  ],
  schedule: [
    ".#...#.",
    "#######",
    "#.#.#.#",
    "#######",
    "#.#.#.#",
    "#######",
    "#.#.#.#",
  ],
  settings: [
    "..#.#..",
    "#######",
    ".#...#.",
    "#.....#",
    ".#...#.",
    "#######",
    "..#.#..",
  ],
};

function PixelGlyph({ pattern, color, pixel = 3 }: { pattern: string[]; color: string; pixel?: number }) {
  return (
    <View>
      {pattern.map((row, y) => (
        <View key={y} style={{ flexDirection: "row" }}>
          {row.split("").map((cell, x) => (
            <View
              key={x}
              style={{ width: pixel, height: pixel, backgroundColor: cell === "#" ? color : "transparent" }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const TABS: { to: string; icon: keyof typeof ICONS; end?: boolean }[] = [
  { to: "/", icon: "home", end: true },
  { to: "/live", icon: "live" },
  { to: "/standings", icon: "standings" },
  { to: "/schedule", icon: "schedule" },
  { to: "/settings", icon: "settings" },
];

export function TabBar() {
  const { C } = useThemeTokens();
  const raceSessions = useActiveRaceSession();
  const isRaceLive = !!(raceSessions.liveRace && getRaceStatus(raceSessions.liveRace, Date.now()) === "live");

  return (
    <nav
      style={{
        display: "flex",
        flexDirection: "row",
        backgroundColor: C.bgPanel,
        borderTop: `2px solid ${C.accent}`,
        height: `calc(62px + env(safe-area-inset-bottom))`,
        paddingBottom: "max(6px, env(safe-area-inset-bottom))",
        flexShrink: 0,
      }}
    >
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.end} style={{ flex: 1, textDecoration: "none" }}>
          {({ isActive }) => (
            <div
              style={sx(
                {
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  position: "relative",
                  cursor: "pointer",
                },
                isActive ? { borderTop: `3px solid ${C.accent}`, backgroundColor: "#1a0005" } : { borderTop: "3px solid transparent" },
              )}
            >
              {t.icon === "live" && isRaceLive && (
                <div style={{ position: "absolute", top: 6, right: "38%", zIndex: 1 }}>
                  <div style={{ width: 8, height: 8, backgroundColor: C.accent }}>
                    <div style={{ width: 4, height: 4, backgroundColor: C.white, margin: 2 }} />
                  </div>
                </div>
              )}
              <PixelGlyph pattern={ICONS[t.icon]} color={isActive ? C.accent : C.greyDark} />
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
