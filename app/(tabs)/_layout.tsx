import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeTokens } from "../../components/theme";
import { useActiveRaceSession, getRaceStatus } from "../../hooks/useOpenF1";

function PixelTabIcon({
  label,
  focused,
  isLive,
  C,
}: {
  label: string;
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
      <Text style={[styles.iconLabel, focused && styles.iconLabelActive]}>
        {label}
      </Text>
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
          tabBarIcon: ({ focused }) => (
            <PixelTabIcon label="HOME" focused={focused} C={C} />
          ),
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          tabBarIcon: ({ focused }) => (
            <PixelTabIcon label="LIVE" focused={focused} isLive={isRaceLive} C={C} />
          ),
        }}
      />
      <Tabs.Screen
        name="standings"
        options={{
          tabBarIcon: ({ focused }) => (
            <PixelTabIcon label="STND" focused={focused} C={C} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          tabBarIcon: ({ focused }) => (
            <PixelTabIcon label="RACE" focused={focused} C={C} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <PixelTabIcon label="SET" focused={focused} C={C} />
          ),
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
  iconLabel: {
    fontFamily: "PressStart2P",
    fontSize: 7,
    color: C.greyDark,
    lineHeight: 12,
  },
  iconLabelActive: {
    color: C.accent,
  },
  liveDotWrap: {
    position: "absolute",
    top: 6,
    right: 4,
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
