import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, Animated, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  liveDrivers, sessionInfo, TEAM_COLORS, TIRE_COLORS,
  Driver, SectorStatus,
} from "../../data/mockData";
import { C, px } from "../../components/theme";

// ── Colour maps ────────────────────────────────────────────────
const SECTOR_COLORS: Record<SectorStatus, string> = {
  fastest:       C.purple,
  personal_best: C.green,
  normal:        C.yellow,
  unknown:       C.greyDark,
};

const TRACK_STATUS_COLORS: Record<string, string> = {
  green: C.green, sc: C.yellow, vsc: C.yellow, red: C.accent, yellow: C.yellow,
};

// ── Pulsing live dot ───────────────────────────────────────────
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

// ── Mini sector strip ──────────────────────────────────────────
function MiniSectors({ driver }: { driver: Driver }) {
  return (
    <View style={styles.miniRow}>
      {driver.miniSectors.map((ms, i) => (
        <View
          key={i}
          style={[
            styles.miniSeg,
            {
              backgroundColor:
                ms.status === "pit" ? C.cyan
                : ms.status === "fastest" ? C.purple
                : ms.status === "personal_best" ? C.green
                : ms.status === "normal" ? C.yellow
                : C.greyDark,
            },
          ]}
        />
      ))}
    </View>
  );
}

// ── Tire badge ─────────────────────────────────────────────────
function TireBadge({ compound, age, isNew }: { compound: string; age: number; isNew: boolean }) {
  const color = TIRE_COLORS[compound] ?? C.white;
  return (
    <View style={[styles.tireBadge, { borderColor: color }]}>
      <Text style={[styles.tireCompound, { color }]}>{compound}</Text>
      <Text style={[styles.tireAge, { color: isNew ? C.green : C.grey }]}>{age}</Text>
    </View>
  );
}

// ── Sector boxes ───────────────────────────────────────────────
function SectorBoxes({ driver }: { driver: Driver }) {
  return (
    <View style={styles.sectorsRow}>
      {driver.sectors.map((s, i) => (
        <View
          key={i}
          style={[styles.sectorBox, { borderColor: SECTOR_COLORS[s.status] }]}
        >
          <Text style={[styles.sectorText, { color: SECTOR_COLORS[s.status] }]}>
            {s.time === "—" ? "--" : s.time}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ── Position change indicator ──────────────────────────────────
function PosChange({ delta }: { delta: number }) {
  if (delta === 0) return <Text style={[px.label, { color: C.greyDark, width: 14 }]}>–</Text>;
  return (
    <Text style={[px.label, { color: delta > 0 ? C.green : C.accent, width: 14 }]}>
      {delta > 0 ? `+${delta}` : `${delta}`}
    </Text>
  );
}

// ── Driver row ─────────────────────────────────────────────────
type ViewMode = "gap" | "interval";

function DriverRow({ driver, mode }: { driver: Driver; mode: ViewMode }) {
  const teamColor = TEAM_COLORS[driver.team] ?? C.grey;
  const gapText = mode === "gap" ? driver.gap : driver.interval;

  const rowBg = driver.fastest
    ? "#140022"
    : driver.inPit
    ? "#001a1a"
    : driver.dnf
    ? "#0a0a0a"
    : C.bg;

  return (
    <View style={[styles.driverRow, { backgroundColor: rowBg, opacity: driver.dnf ? 0.5 : 1 }]}>
      {/* Team stripe */}
      <View style={[styles.teamStripe, { backgroundColor: teamColor }]} />

      {/* Pos */}
      <View style={styles.posWrap}>
        <Text style={[px.h3, { color: driver.dnf ? C.greyDark : C.white }]}>
          {driver.dnf ? "–" : String(driver.pos).padStart(2, " ")}
        </Text>
        <PosChange delta={driver.posChange} />
      </View>

      {/* Driver code + DRS badge */}
      <View style={styles.driverCol}>
        <View style={styles.driverNameRow}>
          <Text style={[px.h2, { color: teamColor }]}>{driver.short}</Text>
          {driver.drs && (
            <View style={styles.drsBadge}>
              <Text style={[px.label, { color: C.bg, fontSize: 5 }]}>DRS</Text>
            </View>
          )}
          {driver.fastest && (
            <View style={styles.flBadge}>
              <Text style={[px.label, { color: C.bg, fontSize: 5 }]}>FL</Text>
            </View>
          )}
          {driver.inPit && (
            <View style={styles.pitBadge}>
              <Text style={[px.label, { color: C.bg, fontSize: 5 }]}>PIT</Text>
            </View>
          )}
        </View>
        <Text style={[px.label, { color: C.greyDark, marginTop: 2 }]}>
          {driver.team.toUpperCase().slice(0, 8)}
        </Text>
      </View>

      {/* Tire */}
      <TireBadge compound={driver.tire} age={driver.tireAge} isNew={driver.tireNew} />

      {/* Pits */}
      <View style={styles.pitsCol}>
        <Text style={[px.label, { color: C.grey }]}>{driver.pits}x</Text>
        <Text style={[px.label, { color: C.greyDark, fontSize: 5 }]}>PIT</Text>
      </View>

      {/* Last lap */}
      <View style={styles.lapCol}>
        <Text style={[
          px.label,
          { color: driver.fastest ? C.purple : driver.dnf ? C.greyDark : C.white, fontSize: 6 },
        ]}>
          {driver.lastLap}
        </Text>
      </View>

      {/* Gap */}
      <View style={styles.gapCol}>
        <Text style={[
          px.label,
          {
            color: gapText === "LEADER" ? C.accent
                 : gapText === "DNF"    ? C.accent
                 : C.white,
            fontSize: 6,
          },
        ]} numberOfLines={1}>
          {gapText}
        </Text>
      </View>
    </View>
  );
}

// ── Expanded row with sectors + mini sectors ───────────────────
function DriverRowExpanded({ driver, mode }: { driver: Driver; mode: ViewMode }) {
  return (
    <View>
      <DriverRow driver={driver} mode={mode} />
      <View style={styles.expandedData}>
        <MiniSectors driver={driver} />
        <SectorBoxes driver={driver} />
      </View>
      <View style={styles.rowSep} />
    </View>
  );
}

// ── Track status bar ───────────────────────────────────────────
function TrackStatusBar() {
  const status = sessionInfo.trackStatus;
  const color = TRACK_STATUS_COLORS[status] ?? C.green;
  const labels: Record<string, string> = {
    green: "TRACK CLEAR", sc: ">>> SAFETY CAR <<<",
    vsc: ">>> VIRTUAL SC <<<", red: "!!! RED FLAG !!!",
    yellow: "YELLOW FLAG",
  };
  if (status === "green") return null;
  return (
    <View style={[styles.statusBar, { backgroundColor: color }]}>
      <BlinkDot color={C.bg} />
      <Text style={[px.label, { color: C.bg }]}>{labels[status]}</Text>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────
export default function LiveScreen() {
  const [mode, setMode] = useState<ViewMode>("gap");
  const [lap, setLap] = useState(sessionInfo.lap);

  useEffect(() => {
    const t = setInterval(() => setLap((l) => Math.min(l + 1, sessionInfo.totalLaps)), 90000);
    return () => clearInterval(t);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── Top header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.liveRow}>
            <BlinkDot />
            <Text style={[px.label, { color: C.accent }]}>LIVE</Text>
          </View>
          <Text style={[px.h2, { color: C.white }]}>
            {sessionInfo.flag} {sessionInfo.name.toUpperCase().slice(0, 18)}
          </Text>
        </View>
        {/* Lap counter box */}
        <View style={styles.lapBox}>
          <Text style={[px.label, { color: C.grey }]}>LAP</Text>
          <Text style={[px.h1, { color: C.yellow }]}>
            {String(lap).padStart(2, "0")}
          </Text>
          <Text style={[px.label, { color: C.grey }]}>/{sessionInfo.totalLaps}</Text>
        </View>
      </View>

      {/* ── Weather strip ── */}
      <View style={styles.weatherStrip}>
        {[
          { label: "AIR", value: `${sessionInfo.airTemp}°` },
          { label: "TRK", value: `${sessionInfo.trackTemp}°` },
          { label: "HUM", value: `${sessionInfo.humidity}%` },
          { label: "WND", value: `${sessionInfo.windSpeed}km/h` },
          { label: "RAIN", value: sessionInfo.rainfall ? "YES" : "NO" },
        ].map((w) => (
          <View key={w.label} style={styles.weatherItem}>
            <Text style={[px.label, { color: C.greyDark, fontSize: 5 }]}>{w.label}</Text>
            <Text style={[px.label, { color: C.cyan, fontSize: 6 }]}>{w.value}</Text>
          </View>
        ))}
      </View>

      {/* ── Track status bar ── */}
      <TrackStatusBar />

      {/* ── Column headers ── */}
      <View style={styles.colHeader}>
        <Text style={[px.label, { width: 52, fontSize: 6 }]}>POS</Text>
        <Text style={[px.label, { flex: 1, fontSize: 6 }]}>DRIVER</Text>
        <Text style={[px.label, { width: 38, fontSize: 6 }]}>TIRE</Text>
        <Text style={[px.label, { width: 28, fontSize: 6 }]}>PIT</Text>
        <Text style={[px.label, { width: 70, fontSize: 6 }]}>LAST LAP</Text>
        <TouchableOpacity
          style={styles.gapToggle}
          onPress={() => setMode(mode === "gap" ? "interval" : "gap")}
        >
          <Text style={[px.label, { color: C.accent, fontSize: 6 }]}>
            {mode === "gap" ? "[GAP]  INT" : " GAP  [INT]"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Driver list ── */}
      <FlatList
        data={liveDrivers}
        keyExtractor={(d) => String(d.num)}
        renderItem={({ item }) => <DriverRowExpanded driver={item} mode={mode} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 12 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", padding: 12, paddingBottom: 8,
    borderBottomWidth: 2, borderBottomColor: C.accent,
  },
  headerLeft: { gap: 4 },
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

  statusBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 6,
  },

  colHeader: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 10, paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: C.borderBright,
    backgroundColor: C.bgPanel,
  },
  gapToggle: { width: 80, alignItems: "flex-end" },

  rowSep: { height: 1, backgroundColor: C.border },

  driverRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 8, paddingRight: 10,
  },
  teamStripe: { width: 3, height: 40, marginRight: 6 },

  posWrap: { width: 46, alignItems: "flex-start", gap: 2 },

  driverCol: { flex: 1 },
  driverNameRow: { flexDirection: "row", alignItems: "center", gap: 4 },

  drsBadge: { backgroundColor: C.green, paddingHorizontal: 3, paddingVertical: 1 },
  flBadge:  { backgroundColor: C.purple, paddingHorizontal: 3, paddingVertical: 1 },
  pitBadge: { backgroundColor: C.cyan, paddingHorizontal: 3, paddingVertical: 1 },

  tireBadge: {
    width: 38, borderWidth: 1, borderRadius: 0,
    alignItems: "center", paddingVertical: 2,
  },
  tireCompound: { fontFamily: "PressStart2P", fontSize: 9, fontWeight: "900" },
  tireAge:      { fontFamily: "PressStart2P", fontSize: 5 },

  pitsCol: { width: 28, alignItems: "center" },

  lapCol: { width: 70 },
  gapCol: { width: 80, alignItems: "flex-end" },

  expandedData: {
    paddingLeft: 9, paddingRight: 10,
    paddingBottom: 6, backgroundColor: C.bgCard, gap: 6,
  },

  miniRow: { flexDirection: "row", gap: 1 },
  miniSeg: { width: 10, height: 4 },

  sectorsRow: { flexDirection: "row", gap: 4 },
  sectorBox: {
    flex: 1, borderWidth: 1, borderRadius: 0,
    alignItems: "center", paddingVertical: 2,
  },
  sectorText: { fontFamily: "PressStart2P", fontSize: 6 },
});
