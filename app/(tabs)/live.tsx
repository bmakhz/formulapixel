import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, Animated, StatusBar, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useActiveRaceSession, useLiveRaceData, formatLapTime, getRaceStatus } from "../../hooks/useOpenF1";
import { useThemeTokens } from "../../components/theme";
import { useSettingsStore } from "../../store/useSettingsStore";
import { formatSpeed, formatTemperature } from "../../utils/unitConversion";
import { teamLiverySource, trackOutlineSource } from "../../utils/imageMaps";

type ViewMode = "gap" | "interval";

// ── Pulsing live dot ────────────────────────────────────────────
function BlinkDot({ color }: { color: string }) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={{ width: 6, height: 6, backgroundColor: color, opacity: anim }} />;
}

// ── Tyre badge ──────────────────────────────────────────────────
const TYRE_COLORS: Record<string, string> = {
  SOFT: "#FF3333", MEDIUM: "#FFE600", HARD: "#DDDDDD",
  INTERMEDIATE: "#39B54A", WET: "#0067FF",
  S: "#FF3333", M: "#FFE600", H: "#DDDDDD",
  I: "#39B54A", W: "#0067FF",
};

function TireBadge({ compound, age, C, styles }: { compound: string; age: number; C: any; styles: any }) {
  const short = compound?.charAt(0) ?? "-";
  const color = TYRE_COLORS[compound?.toUpperCase()] ?? TYRE_COLORS[short] ?? C.white;
  return (
    <View style={[styles.tireBadge, { borderColor: color, backgroundColor: C.bgCard }]}>
      <Text style={[styles.tireCompound, { color }]}>{short}</Text>
      <Text style={[styles.tireAge]}>{age}</Text>
    </View>
  );
}

// ── Sector time ─────────────────────────────────────────────────
function SectorCell({ value, styles }: { value: number | null; styles: any }) {
  const text = value != null && value > 0 ? value.toFixed(2) : "--.-";
  return <Text style={styles.sectorText}>{text}</Text>;
}

// ── Driver row ──────────────────────────────────────────────────
type DriverItem = ReturnType<typeof useLiveRaceData>["rows"][number];

function DriverRow({ driver, mode, C, px, styles }: { driver: DriverItem; mode: ViewMode; C: any; px: any; styles: any }) {
  const gapText = mode === "gap" ? driver.gap : driver.gapToNext;
  const rowBg = driver.status !== "RUN" ? C.bgPanel : C.bg;
  const livery = teamLiverySource(driver.team);

  return (
    <View style={[styles.driverRow, { backgroundColor: rowBg, opacity: driver.status !== "RUN" ? 0.65 : 1 }]}> 
      {/* Team stripe */}
      <View style={[styles.teamStripe, { backgroundColor: driver.teamColor }]} />

      {/* POS */}
      <View style={styles.posWrap}>
        <Text style={[px.h3, { color: driver.status !== "RUN" ? C.greyDark : C.white }]}>{driver.status !== "RUN" ? "--" : String(driver.position).padStart(2, " ")}</Text>
      </View>

      {livery && <Image source={livery} style={styles.livery} resizeMode="contain" />}

      {/* DRIVER */}
      <View style={styles.driverCol}>
        <Text style={[px.h2, { color: driver.teamColor || C.white }]}>{driver.short}</Text>
        <Text style={[px.label, { color: C.greyDark, marginTop: 2, fontSize: 5 }]} numberOfLines={1}>
          {driver.team.toUpperCase().slice(0, 10)}
        </Text>
      </View>

      {/* GAP */}
      <View style={styles.gapCol}>
        <Text style={[px.label, { color: driver.status !== "RUN" ? C.accent : gapText === "LEADER" ? C.accent : C.white, fontSize: 6 }]} numberOfLines={1}>
          {driver.status !== "RUN" ? driver.status : gapText === "LEADER" ? "LDR" : gapText}
        </Text>
      </View>

      {/* TYRE + AGE */}
      <TireBadge compound={driver.compound} age={driver.tireAge} C={C} styles={styles} />

      {/* PITS */}
      <View style={styles.pitsCol}>
        <Text style={[px.label, { color: C.grey }]}>{driver.pits}</Text>
        <Text style={[px.label, { color: C.greyDark, fontSize: 5 }]}>PIT</Text>
      </View>

      {/* S1 S2 S3 */}
      <View style={styles.sectorsCol}>
        <SectorCell value={driver.sectorTimes[0]} styles={styles} />
        <SectorCell value={driver.sectorTimes[1]} styles={styles} />
        <SectorCell value={driver.sectorTimes[2]} styles={styles} />
      </View>

      {/* BEST LAP */}
      <View style={styles.lapCol}>
        <Text style={styles.lapText}>{formatLapTime(driver.bestLapTime)}</Text>
      </View>

      {/* LAST LAP */}
      <View style={styles.lapCol}>
        <Text style={styles.lapText}>{formatLapTime(driver.lapTime)}</Text>
      </View>
    </View>
  );
}

// ── Main screen ─────────────────────────────────────────────────
export default function LiveScreen() {
  const { C, px, statusBarStyle, mode: themeMode, scaleValue } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(C, scaleValue), [C, scaleValue]);
  const [mode, setMode] = useState<ViewMode>("gap");
  const speedUnit = useSettingsStore((s) => s.speedUnit);
  const temperatureUnit = useSettingsStore((s) => s.temperatureUnit);
  const raceSessions = useActiveRaceSession();
  const activeSession = raceSessions.liveSession ?? raceSessions.activeRace;
  const liveData = useLiveRaceData(activeSession?.session_key ?? null);

  const raceName = activeSession?.country_name ?? activeSession?.meeting_name ?? "GRAND PRIX";
  const sessionStatus = activeSession ? getRaceStatus(activeSession, Date.now()) : "upcoming";
  const isLive = sessionStatus === "live";
  const isRaceOver = activeSession?.session_type === "Race" && sessionStatus === "done";
  const sessionLabel = (activeSession?.session_type ?? activeSession?.session_name ?? "SESSION").toUpperCase();
  const airTemp = liveData.latestWeather?.air_temperature;
  const trkTemp = liveData.latestWeather?.track_temperature;
  const trackOutline = trackOutlineSource(themeMode, activeSession?.country_name, activeSession?.location, activeSession?.circuit_short_name);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={C.bg} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.liveRow}>
            {isLive ? <BlinkDot color={C.accent} /> : <View style={{ width: 6, height: 6, backgroundColor: C.greyDark }} />}
            <Text style={[px.label, { color: isLive ? C.accent : C.grey }]}>{isLive ? "LIVE" : isRaceOver ? "FINISHED" : "LATEST"}</Text>
            <Text style={[px.label, { color: C.cyan }]}>{sessionLabel}</Text>
            {isRaceOver && <Text style={[px.label, { color: C.yellow }]}>🏁</Text>}
          </View>
          <View style={styles.titleRow}>
            {trackOutline && <Image source={trackOutline} style={styles.trackOutline} resizeMode="contain" />}
            <Text style={[px.h2, { color: C.white, flex: 1 }]}>{raceName.toUpperCase().slice(0, 20)}</Text>
          </View>
        </View>
        <View style={styles.lapBox}>
          <Text style={[px.label, { color: C.grey }]}>LAP</Text>
          <Text style={[px.h1, { color: C.yellow }]}>{String(liveData.currentLap ?? "--").padStart(2, "0")}</Text>
          <Text style={[px.label, { color: C.grey }]}>/--</Text>
        </View>
      </View>

      {/* ── Weather ── */}
      <View style={styles.weatherStrip}>
        {[
          { label: "AIR",  value: formatTemperature(airTemp, temperatureUnit) },
          { label: "TRK",  value: formatTemperature(trkTemp, temperatureUnit) },
          { label: "HUM",  value: liveData.latestWeather?.humidity != null ? `${Math.round(liveData.latestWeather.humidity)}%` : "--" },
          { label: "WND",  value: formatSpeed(liveData.latestWeather?.wind_speed, speedUnit) },
          { label: "RAIN", value: liveData.latestWeather?.rainfall ? "YES" : "NO" },
        ].map((w) => (
          <View key={w.label} style={styles.weatherItem}>
            <Text style={[px.label, { color: C.greyDark, fontSize: 5 }]}>{w.label}</Text>
            <Text style={[px.label, { color: C.cyan, fontSize: 6 }]}>{w.value}</Text>
          </View>
        ))}
      </View>

      {/* ── Column headers ── */}
      <ScrollableHeaders mode={mode} onToggle={() => setMode(m => m === "gap" ? "interval" : "gap")} C={C} styles={styles} />

      {/* ── Driver list ── */}
      {liveData.isLoading && liveData.rows.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={[px.label, { color: C.greyDark }]}>LOADING...</Text>
        </View>
      ) : (
        <FlatList
          data={liveData.rows}
          keyExtractor={(d) => String(d.driverNumber)}
          renderItem={({ item }) => <DriverRow driver={item} mode={mode} C={C} px={px} styles={styles} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 12 }}
          ItemSeparatorComponent={() => <View style={styles.rowSep} />}
          horizontal={false}
        />
      )}
    </SafeAreaView>
  );
}

function ScrollableHeaders({ mode, onToggle, C, styles }: { mode: ViewMode; onToggle: () => void; C: any; styles: any }) {
  return (
    <View style={styles.colHeader}>
      <Text style={[styles.colText, { width: 26 }]}>POS</Text>
      <Text style={[styles.colText, { width: 60 }]}>DRIVER</Text>
      <TouchableOpacity style={{ width: 52 }} onPress={onToggle}>
        <Text style={[styles.colText, { color: C.accent }]}>{mode === "gap" ? "[GAP]" : "[INT]"}</Text>
      </TouchableOpacity>
      <Text style={[styles.colText, { width: 34 }]}>TYR</Text>
      <Text style={[styles.colText, { width: 22 }]}>PIT</Text>
      <Text style={[styles.colText, { width: 70 }]}>S1·S2·S3</Text>
      <Text style={[styles.colText, { width: 60 }]}>BEST</Text>
      <Text style={[styles.colText, { width: 60 }]}>LAST</Text>
    </View>
  );
}

function createStyles(C: any, scale: number) {
  const s = Math.max(0.9, Math.min(1.2, scale));
  const m = (n: number) => Math.round(n * s);
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    padding: m(12), paddingBottom: m(8),
    borderBottomWidth: 2, borderBottomColor: C.accent,
  },
  headerLeft: { gap: m(4), flex: 1 },
  liveRow: { flexDirection: "row", alignItems: "center", gap: m(6) },
  titleRow: { flexDirection: "row", alignItems: "center", gap: m(8) },
  trackOutline: { width: m(44), height: m(24) },
  lapBox: {
    borderWidth: 2, borderColor: C.yellow,
    padding: m(8), alignItems: "center", backgroundColor: C.bgCard,
  },

  weatherStrip: {
    flexDirection: "row", justifyContent: "space-around",
    paddingVertical: m(6), paddingHorizontal: m(8),
    backgroundColor: C.bgPanel,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  weatherItem: { alignItems: "center", gap: m(2) },

  colHeader: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: m(9), paddingVertical: m(5),
    borderBottomWidth: 1, borderBottomColor: C.borderBright,
    backgroundColor: C.bgPanel,
  },
  colText: { fontFamily: "PressStart2P", fontSize: 5, color: C.grey },

  rowSep: { height: 1, backgroundColor: C.border },

  driverRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: m(8), paddingRight: m(8),
    minHeight: m(48),
  },
  teamStripe: { width: 3, height: m(38), marginRight: m(6) },
  livery: { width: m(32), height: m(20), marginRight: m(6) },

  posWrap:   { width: 26, alignItems: "flex-start" },
  driverCol: { width: 60 },
  gapCol:    { width: 52 },

  tireBadge: { width: 34, borderWidth: 1, alignItems: "center", paddingVertical: m(2), marginRight: 0 },
  tireCompound: { fontFamily: "PressStart2P", fontSize: 8, fontWeight: "900" },
  tireAge:      { fontFamily: "PressStart2P", fontSize: 5, color: "#888" },

  pitsCol: { width: 22, alignItems: "center" },

  sectorsCol: { width: 70, gap: 1 },
  sectorText: { fontFamily: "PressStart2P", fontSize: 5, color: C.grey },

  lapCol: { width: 60 },
  lapText: { fontFamily: "PressStart2P", fontSize: 5, color: C.white },
  });
}
