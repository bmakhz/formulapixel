import React from "react";
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  sessionInfo, liveDrivers, driverStandings,
  constructorStandings, schedule, TEAM_COLORS,
} from "../data/mockData";
import { C, px, pixelBorder } from "../components/theme";

// ── Pixel Box component ────────────────────────────────────────
function PBox({
  children, style, color = C.border,
}: { children: React.ReactNode; style?: any; color?: string }) {
  return (
    <View style={[{ borderWidth: 2, borderColor: color, borderRadius: 0, backgroundColor: C.bgCard }, style]}>
      {children}
    </View>
  );
}

function PLabel({ children, color = C.grey }: { children: string; color?: string }) {
  return (
    <Text style={[px.label, { color, marginBottom: 4 }]}>{children}</Text>
  );
}

// ── Dither pattern background ──────────────────────────────────
function DitherBar({ color }: { color: string }) {
  // Simulated with alternating small squares in a row
  return (
    <View style={{ flexDirection: "row", height: 4, overflow: "hidden" }}>
      {Array.from({ length: 40 }).map((_, i) => (
        <View
          key={i}
          style={{ width: 4, height: 4, backgroundColor: i % 2 === 0 ? color : "transparent" }}
        />
      ))}
    </View>
  );
}

// ── Track status pixel indicator ───────────────────────────────
function TrackStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    green:  { label: "TRACK CLEAR", color: C.green },
    sc:     { label: "SAFETY CAR",  color: C.yellow },
    vsc:    { label: "VIRT SC",     color: C.yellow },
    red:    { label: "RED FLAG",    color: C.accent },
    yellow: { label: "YELLOW",      color: C.yellow },
  };
  const s = map[status] ?? map.green;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View style={{ width: 8, height: 8, backgroundColor: s.color }} />
      <Text style={[px.label, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const liveRace = schedule.find((r) => r.status === "live");
  const nextRace = schedule.find((r) => r.status === "upcoming");
  const top3 = liveDrivers.slice(0, 3);
  const leader = driverStandings[0];
  const conLeader = constructorStandings[0];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={[px.label, { color: C.accent }]}>[ FORMULA 1 ]</Text>
            <Text style={[px.h1, { marginTop: 6 }]}>F1 DASH</Text>
          </View>
          <PBox style={styles.seasonBox} color={C.accent}>
            <Text style={[px.h3, { color: C.accent }]}>2024</Text>
          </PBox>
        </View>

        <DitherBar color={C.accent} />

        {/* ── Live Race Banner ── */}
        {liveRace && (
          <TouchableOpacity
            style={styles.liveBannerWrap}
            onPress={() => router.push("/tabs/live")}
            activeOpacity={0.85}
          >
            <PBox color={C.accent} style={styles.liveBanner}>
              {/* header row */}
              <View style={styles.liveBannerTop}>
                <View style={styles.liveChip}>
                  <View style={styles.liveChipDot} />
                  <Text style={[px.label, { color: C.bg }]}>LIVE</Text>
                </View>
                <Text style={[px.label, { color: C.grey }]}>
                  RND {liveRace.round} · {sessionInfo.sessionType}
                </Text>
                <TrackStatusBadge status={sessionInfo.trackStatus} />
              </View>

              {/* race name */}
              <Text style={[px.h2, { color: C.accent, marginBottom: 2 }]}>
                {liveRace.flag} {liveRace.shortName}
              </Text>
              <Text style={[px.label, { color: C.grey, marginBottom: 12 }]}>
                {liveRace.circuit.toUpperCase()}
              </Text>

              {/* lap counter */}
              <View style={styles.lapRow}>
                <PBox color={C.borderBright} style={styles.lapBox}>
                  <PLabel>LAP</PLabel>
                  <Text style={[px.h1, { color: C.yellow }]}>
                    {sessionInfo.lap}
                    <Text style={[px.label, { color: C.grey }]}>/{sessionInfo.totalLaps}</Text>
                  </Text>
                </PBox>
                <PBox color={C.borderBright} style={styles.lapBox}>
                  <PLabel>AIR</PLabel>
                  <Text style={[px.h2, { color: C.cyan }]}>{sessionInfo.airTemp}°C</Text>
                </PBox>
                <PBox color={C.borderBright} style={styles.lapBox}>
                  <PLabel>TRK</PLabel>
                  <Text style={[px.h2, { color: C.cyan }]}>{sessionInfo.trackTemp}°C</Text>
                </PBox>
              </View>

              {/* top 3 */}
              <View style={styles.top3Row}>
                {top3.map((d, i) => (
                  <PBox
                    key={d.num}
                    color={TEAM_COLORS[d.team]}
                    style={styles.top3Card}
                  >
                    <Text style={[px.label, { color: C.grey }]}>P{d.pos}</Text>
                    <Text style={[px.h2, { color: C.white, marginTop: 2 }]}>{d.short}</Text>
                    <Text style={[px.label, { color: d.gap === "LEADER" ? C.accent : C.grey, marginTop: 4 }]} numberOfLines={1}>
                      {d.gap === "LEADER" ? "LEAD" : d.gap}
                    </Text>
                  </PBox>
                ))}
              </View>

              {/* CTA */}
              <View style={styles.ctaBtn}>
                <Text style={[px.label, { color: C.bg }]}>► OPEN LEADERBOARD</Text>
              </View>
            </PBox>
          </TouchableOpacity>
        )}

        {/* ── Championship Leaders ── */}
        <Text style={[px.label, styles.sectionLabel]}>// CHAMPIONSHIP</Text>
        <View style={styles.champRow}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => router.push("/tabs/standings")}
            activeOpacity={0.8}
          >
            <PBox color={TEAM_COLORS[leader.team] ?? C.border} style={styles.champCard}>
              <PLabel>DRIVERS</PLabel>
              <View style={[styles.champTeamBar, { backgroundColor: TEAM_COLORS[leader.team] }]} />
              <Text style={[px.h2, { color: C.white, marginTop: 6 }]}>{leader.short}</Text>
              <Text style={[px.label, { color: C.grey, marginTop: 2 }]}>{leader.team.toUpperCase()}</Text>
              <Text style={[px.h1, { color: C.yellow, marginTop: 8 }]}>{leader.points}</Text>
              <Text style={[px.label, { color: C.grey }]}>PTS</Text>
            </PBox>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => router.push("/tabs/standings")}
            activeOpacity={0.8}
          >
            <PBox color={conLeader.color} style={styles.champCard}>
              <PLabel>CONSTRUCTORS</PLabel>
              <View style={[styles.champTeamBar, { backgroundColor: conLeader.color }]} />
              <Text style={[px.h2, { color: C.white, marginTop: 6 }]}>{conLeader.name.toUpperCase()}</Text>
              <Text style={[px.label, { color: C.grey, marginTop: 2 }]}>{conLeader.wins} WINS</Text>
              <Text style={[px.h1, { color: C.yellow, marginTop: 8 }]}>{conLeader.points}</Text>
              <Text style={[px.label, { color: C.grey }]}>PTS</Text>
            </PBox>
          </TouchableOpacity>
        </View>

        {/* ── Next Race ── */}
        {nextRace && (
          <>
            <Text style={[px.label, styles.sectionLabel]}>// NEXT RACE</Text>
            <TouchableOpacity onPress={() => router.push("/tabs/schedule")} activeOpacity={0.85}>
              <PBox color={C.borderBright} style={styles.nextRaceCard}>
                <View style={styles.nextRaceLeft}>
                  <Text style={{ fontSize: 28 }}>{nextRace.flag}</Text>
                  <View>
                    <Text style={[px.h3, { color: C.white }]}>RND {nextRace.round}</Text>
                    <Text style={[px.label, { color: C.accent, marginTop: 4 }]}>{nextRace.shortName}</Text>
                    <Text style={[px.label, { color: C.grey, marginTop: 2 }]}>{nextRace.dates.toUpperCase()}</Text>
                  </View>
                </View>
                <View style={styles.nextRaceRight}>
                  <Text style={[px.label, { color: C.grey }]}>{nextRace.circuit.toUpperCase()}</Text>
                </View>
              </PBox>
            </TouchableOpacity>
          </>
        )}

        {/* ── Season Stats ── */}
        <Text style={[px.label, styles.sectionLabel]}>// SEASON 2024</Text>
        <View style={styles.statsGrid}>
          {[
            { label: "DONE", value: "2" },
            { label: "LEFT", value: String(schedule.length - 2) },
            { label: "SC DEPLOY", value: "4" },
            { label: "LEADERS", value: "1" },
          ].map((s) => (
            <PBox key={s.label} color={C.border} style={styles.statCard}>
              <Text style={[px.h1, { color: C.white }]}>{s.value}</Text>
              <Text style={[px.label, { color: C.grey, marginTop: 6 }]}>{s.label}</Text>
            </PBox>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },

  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", padding: 16, paddingBottom: 12,
  },
  seasonBox: { padding: 8 },

  liveBannerWrap: { margin: 12, marginTop: 10 },
  liveBanner: { padding: 14 },
  liveBannerTop: {
    flexDirection: "row", alignItems: "center",
    gap: 10, marginBottom: 10,
  },
  liveChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: C.accent, paddingHorizontal: 6, paddingVertical: 3,
  },
  liveChipDot: { width: 4, height: 4, backgroundColor: C.bg },

  lapRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  lapBox: { flex: 1, padding: 10 },

  top3Row: { flexDirection: "row", gap: 8, marginBottom: 12 },
  top3Card: { flex: 1, padding: 10 },

  ctaBtn: {
    backgroundColor: C.accent, padding: 10,
    alignItems: "center",
  },

  sectionLabel: {
    marginHorizontal: 12, marginTop: 16, marginBottom: 8, color: C.borderBright,
  },
  champRow: { flexDirection: "row", gap: 8, marginHorizontal: 12 },
  champCard: { padding: 12 },
  champTeamBar: { height: 3, width: "100%" },

  nextRaceCard: { marginHorizontal: 12, padding: 14 },
  nextRaceLeft: { flexDirection: "row", gap: 14, alignItems: "center", marginBottom: 8 },
  nextRaceRight: {},

  statsGrid: {
    flexDirection: "row", flexWrap: "wrap",
    marginHorizontal: 12, gap: 8,
  },
  statCard: { width: "47%", padding: 14 },
});
