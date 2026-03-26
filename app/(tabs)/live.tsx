import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, Animated, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useActiveRaceSession, useLiveRaceData, formatLapTime, formatSectorTime } from "../../hooks/useOpenF1";
import { C, px } from "../../components/theme";

type ViewMode = "gap" | "interval";

// ── Pulsing live dot ────────────────────────────────────────────
function BlinkDot({ color = C.accent }: { color?: string }) {
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
  SOFT: C.soft ?? "#FF3333", MEDIUM: C.medium ?? "#FFE600", HARD: C.hard ?? "#DDDDDD",
  INTERMEDIATE: C.inter ?? "#39B54A", WET: C.wet ?? "#0067FF",
  S: C.soft ?? "#FF3333", M: C.medium ?? "#FFE600", H: C.hard ?? "#DDDDDD",
  I: C.inter ?? "#39B54A", W: C.wet ?? "#0067FF",
};

function TireBadge({ compound, age }: { compound: string; age: number }) {
  const short = compound?.charAt(0) ?? "-";
  const color = TYRE_COLORS[compound?.toUpperCase()] ?? TYRE_COLORS[short] ?? C.white;
  return (
    <View style={[styles.tireBadge, { borderColor: color }]}>
      <Text style={[styles.tireCompound, { color }]}>{short}</Text>
      <Text style={[styles.tireAge]}>{age}</Text>
    </View>
  );
}

// ── Sector time ─────────────────────────────────────────────────
function SectorCell({ value }: { value: number | null }) {
  const text = value != null && value > 0 ? value.toFixed(2) : "--.-";
  return <Text style={styles.sectorText}>{text}</Text>;
}

// ── Driver row ──────────────────────────────────────────────────
type DriverItem = ReturnType<typeof useLiveRaceData>["rows"][number];

function DriverRow({ driver, mode }: { driver: DriverItem; mode: ViewMode }) {
  const gapText = mode === "gap" ? driver.gap : driver.gapToNext;
  const rowBg = C.bg;

  return (
    <View style={[styles.driverRow, { backgroundColor: rowBg }]}>
      {/* Team stripe */}
      <View style={[styles.teamStripe, { backgroundColor: driver.teamColor }]} />

      {/* POS */}
      <View style={styles.posWrap}>
        <Text style={[px.h3, { color: C.white }]}>{String(driver.position).padStart(2, " ")}</Text>
      </View>

      {/* DRIVER */}
      <View style={styles.driverCol}>
        <Text style={[px.h2, { color: driver.teamColor || C.white }]}>{driver.short}</Text>
        <Text style={[px.label, { color: C.greyDark, marginTop: 2, fontSize: 5 }]} numberOfLines={1}>
          {driver.team.toUpperCase().slice(0, 10)}
        </Text>
      </View>

      {/* GAP */}
      <View style={styles.gapCol}>
        <Text style={[px.label, { color: gapText === "LEADER" ? C.accent : C.white, fontSize: 6 }]} numberOfLines={1}>
          {gapText === "LEADER" ? "LDR" : gapText}
        </Text>
      </View>

      {/* TYRE + AGE */}
      <TireBadge compound={driver.compound} age={driver.tireAge} />

      {/* PITS */}
      <View style={styles.pitsCol}>
        <Text style={[px.label, { color: C.grey }]}>{driver.pits}</Text>
        <Text style={[px.label, { color: C.greyDark, fontSize: 5 }]}>PIT</Text>
      </View>

      {/* S1 S2 S3 */}
      <View style={styles.sectorsCol}>
        <SectorCell value={driver.sectorTimes[0]} />
        <SectorCell value={driver.sectorTimes[1]} />
        <SectorCell value={driver.sectorTimes[2]} />
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
  const [mode, setMode] = useState<ViewMode>("gap");
  const raceSessions = useActiveRaceSession();
  const activeSession = raceSessions.activeRace;
  const liveData = useLiveRaceData(activeSession?.session_key ?? null);

  const raceName = activeSession?.country_name ?? activeSession?.meeting_name ?? "GRAND PRIX";
  const isLive = !!raceSessions.liveRace;
  const airTemp = liveData.latestWeather?.air_temperature;
  const trkTemp = liveData.latestWeather?.track_temperature;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.liveRow}>
            <BlinkDot />
            <Text style={[px.label, { color: C.accent }]}>{isLive ? "LIVE" : "LATEST"}</Text>
          </View>
          <Text style={[px.h2, { color: C.white }]}>{raceName.toUpperCase().slice(0, 20)}</Text>
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
          { label: "AIR",  value: airTemp != null ? `${Math.round(airTemp)}°` : "--" },
          { label: "TRK",  value: trkTemp != null ? `${Math.round(trkTemp)}°` : "--" },
          { label: "HUM",  value: liveData.latestWeather?.humidity != null ? `${Math.round(liveData.latestWeather.humidity)}%` : "--" },
          { label: "WND",  value: liveData.latestWeather?.wind_speed != null ? `${Math.round(liveData.latestWeather.wind_speed)}km/h` : "--" },
          { label: "RAIN", value: liveData.latestWeather?.rainfall ? "YES" : "NO" },
        ].map((w) => (
          <View key={w.label} style={styles.weatherItem}>
            <Text style={[px.label, { color: C.greyDark, fontSize: 5 }]}>{w.label}</Text>
            <Text style={[px.label, { color: C.cyan, fontSize: 6 }]}>{w.value}</Text>
          </View>
        ))}
      </View>

      {/* ── Column headers ── */}
      <ScrollableHeaders mode={mode} onToggle={() => setMode(m => m === "gap" ? "interval" : "gap")} />

      {/* ── Driver list ── */}
      {liveData.isLoading && liveData.rows.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={[px.label, { color: C.greyDark }]}>LOADING...</Text>
        </View>
      ) : (
        <FlatList
          data={liveData.rows}
          keyExtractor={(d) => String(d.driverNumber)}
          renderItem={({ item }) => <DriverRow driver={item} mode={mode} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 12 }}
          ItemSeparatorComponent={() => <View style={styles.rowSep} />}
          horizontal={false}
        />
      )}
    </SafeAreaView>
  );
}

function ScrollableHeaders({ mode, onToggle }: { mode: ViewMode; onToggle: () => void }) {
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    padding: 12, paddingBottom: 8,
    borderBottomWidth: 2, borderBottomColor: C.accent,
  },
  headerLeft: { gap: 4, flex: 1 },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  lapBox: {
    borderWidth: 2, borderColor: C.yellow,
    padding: 8, alignItems: "center", backgroundColor: C.bgCard,
  },

  weatherStrip: {
    flexDirection: "row", justifyContent: "space-around",
    paddingVertical: 6, paddingHorizontal: 8,
    backgroundColor: C.bgPanel,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  weatherItem: { alignItems: "center", gap: 2 },

  colHeader: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 9, paddingVertical: 5,
    borderBottomWidth: 1, borderBottomColor: C.borderBright,
    backgroundColor: C.bgPanel,
  },
  colText: { fontFamily: "PressStart2P", fontSize: 5, color: C.grey },

  rowSep: { height: 1, backgroundColor: C.border },

  driverRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 7, paddingRight: 6,
  },
  teamStripe: { width: 3, height: 38, marginRight: 6 },

  posWrap:   { width: 26, alignItems: "flex-start" },
  driverCol: { width: 60 },
  gapCol:    { width: 52 },

  tireBadge: { width: 34, borderWidth: 1, alignItems: "center", paddingVertical: 2, marginRight: 0 },
  tireCompound: { fontFamily: "PressStart2P", fontSize: 8, fontWeight: "900" },
  tireAge:      { fontFamily: "PressStart2P", fontSize: 5, color: "#888" },

  pitsCol: { width: 22, alignItems: "center" },

  sectorsCol: { width: 70, gap: 1 },
  sectorText: { fontFamily: "PressStart2P", fontSize: 5, color: C.grey },

  lapCol: { width: 60 },
  lapText: { fontFamily: "PressStart2P", fontSize: 5, color: C.white },
});
