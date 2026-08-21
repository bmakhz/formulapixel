import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeTokens } from "../../components/theme";
import { useActiveRaceSession, getRaceStatus } from "../../hooks/useOpenF1";

// ── Pixel glyphs (7×7 grids, "#" = filled pixel) ─────────────────
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

function PixelTabIcon({
  icon,
  focused,
  isLive,
  C,
}: {
  icon: keyof typeof ICONS;
  focused: boolean;
  isLive?: boolean;
  C: any;
}) {
  const styles = createStyles(C, 0);
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      {isLive && (
        <View style={styles.liveDotWrap}>
          <View style={styles.liveDotOuter}>
            <View style={styles.liveDotInner} />
          </View>
        </View>
      )}
      <PixelGlyph pattern={ICONS[icon]} color={focused ? C.accent : C.greyDark} />
    </View>
  );
}

export default function TabsLayout() {
  const { C } = useThemeTokens();
  const insets = useSafeAreaInsets();
  const raceSessions = useActiveRaceSession();
  const isRaceLive = !!(raceSessions.liveRace && getRaceStatus(raceSessions.liveRace, Date.now()) === "live");
  const styles = createStyles(C, insets.bottom);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => <View style={styles.tabBarBg} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <PixelTabIcon icon="home" focused={focused} C={C} />,
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          tabBarIcon: ({ focused }) => (
            <PixelTabIcon icon="live" focused={focused} isLive={isRaceLive} C={C} />
          ),
        }}
      />
      <Tabs.Screen
        name="standings"
        options={{
          tabBarIcon: ({ focused }) => <PixelTabIcon icon="standings" focused={focused} C={C} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          tabBarIcon: ({ focused }) => <PixelTabIcon icon="schedule" focused={focused} C={C} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => <PixelTabIcon icon="settings" focused={focused} C={C} />,
        }}
      />
    </Tabs>
  );
}

function createStyles(C: any, bottomInset: number) {
  return StyleSheet.create({
  tabBar: {
    backgroundColor: C.bgPanel,
    borderTopWidth: 2,
    borderTopColor: C.accent,
    height: 62 + bottomInset,
    paddingBottom: Math.max(6, bottomInset),
    paddingTop: 0,
  },
  tabBarBg: {
    flex: 1,
    backgroundColor: C.bgPanel,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderTopWidth: 0,
    position: "relative",
  },
  iconWrapActive: {
    borderTopWidth: 3,
    borderTopColor: C.accent,
    backgroundColor: "#1a0005",
  },
  liveDotWrap: {
    position: "absolute",
    top: 6,
    right: 4,
    zIndex: 1,
  },
  liveDotOuter: {
    width: 8,
    height: 8,
    borderRadius: 0,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  liveDotInner: {
    width: 4,
    height: 4,
    backgroundColor: C.white,
  },
  });
}
