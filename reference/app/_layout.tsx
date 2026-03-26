import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { useFonts, PressStart2P_400Regular } from "@expo-google-fonts/press-start-2p";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { C } from "../components/theme";

SplashScreen.preventAutoHideAsync();

function PixelTabIcon({
  label,
  focused,
  isLive,
}: {
  label: string;
  focused: boolean;
  isLive?: boolean;
}) {
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

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ PressStart2P: PressStart2P_400Regular });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

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
            <PixelTabIcon label="HOME" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="tabs/live"
        options={{
          tabBarIcon: ({ focused }) => (
            <PixelTabIcon label="LIVE" focused={focused} isLive />
          ),
        }}
      />
      <Tabs.Screen
        name="tabs/standings"
        options={{
          tabBarIcon: ({ focused }) => (
            <PixelTabIcon label="STND" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="tabs/schedule"
        options={{
          tabBarIcon: ({ focused }) => (
            <PixelTabIcon label="RACE" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="tabs/settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <PixelTabIcon label="SET" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: C.bgPanel,
    borderTopWidth: 2,
    borderTopColor: C.accent,
    height: 72,
    paddingBottom: 0,
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
    borderRadius: 0, // pixel square dot
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
