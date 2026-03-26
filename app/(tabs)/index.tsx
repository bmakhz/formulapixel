import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  getRaceStatus, useActiveRaceSession, useLiveRaceData,
  useDriverStandings, useConstructorStandings, useLastRaceResults,
  parseDate,
} from "../../hooks/useOpenF1";
import { C, px } from "../../components/theme";

// ── Pixel Box ─────────────────────────────────────────────────
function PBox({ children, style, color = C.border }: { children: React.ReactNode; style?: any; color?: string }) {
  return (
    <View style={[{ borderWidth: 2, borderColor: color, borderRadius: 0, backgroundColor: C.bgCard }, style]}>
      {children}
    </View>
  );
}

// ── Dither bar ────────────────────────────────────────────────
function DitherBar({ color }: { color: string }) {
  return (
    <View style={{ flexDirection: "row", height: 4, overflow: "hidden" }}>
      {Array.from({ length: 40 }).map((_, i) => (
        <View key={i} style={{ width: 4, height: 4, backgroundColor: i % 2 === 0 ? color : "transparent" }} />
      ))}
    </View>
  );
}

// ── Countdown timer ───────────────────────────────────────────
function useCountdown(targetDate?: string) {
  const [diff, setDiff] = useState(0);

  useEffect(() => {
    if (!targetDate) return;
    const target = parseDate(targetDate);
    const update = () => setDiff(Math.max(0, target - Date.now()));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return { days, hours, mins, secs, ready: diff > 0 };
}

function CountdownBox({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.countCell}>
      <Text style={[px.h2, { color: C.yellow }]}>{String(value).padStart(2, "0")}</Text>
      <Text style={[px.label, { color: C.greyDark, fontSize: 5 }]}>{label}</Text>
    </View>
  );
}

// ── Section heading ───────────────────────────────────────────
function SectionHead({ label }: { label: string }) {
  return (
    <View style={styles.sectionHead}>
      <View style={styles.sectionTick} />
      <Text style={[px.h3, { color: C.accent }]}>{label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const raceSessions = useActiveRaceSession();
  const activeSession = raceSessions.activeRace;
  const liveData = useLiveRaceData(activeSession?.session_key ?? null);

  const liveRace = raceSessions.liveRace;
  const nextRace = raceSessions.nextRace;
  const top3Live = liveData.top3;

  const driverStandingsQuery = useDriverStandings();
  const constructorStandingsQuery = useConstructorStandings();
  const lastRaceQuery = useLastRaceResults();

  const driverStandings = driverStandingsQuery.data ?? [];
  const constructorStandings = constructorStandingsQuery.data ?? [];
  const lastRaceTop3 = (lastRaceQuery.data ?? []).slice(0, 3);

  const now = Date.now();
  const raceDone = raceSessions.races.filter((r) => getRaceStatus(r, now) === "done").length;
  const totalRaces = raceSessions.races.length;
  const nextRaceIndex = raceDone + 1;

  // Find the earliest session of the next race weekend for countdown
  const countdown = useCountdown(nextRace?.date_start);

  const PODIUM_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={[px.label, { color: C.accent }]}>[ FORMULA 1 ]</Text>
            <Text style={[px.h1, { marginTop: 4, letterSpacing: 1 }]}>FORMULA LIVE</Text>
          </View>
          <PBox style={styles.seasonBox} color={C.accent}>
            <Text style={[px.h3, { color: C.accent }]}>{new Date().getFullYear()}</Text>
          </PBox>
        </View>

        <DitherBar color={C.accent} />

        {/* ── Live Race Banner ── */}
        {liveRace && (
          <TouchableOpacity style={styles.liveBannerWrap} onPress={() => router.push("/(tabs)/live")} activeOpacity={0.85}>
            <PBox color={C.accent} style={styles.liveBanner}>
              <View style={styles.liveBannerTop}>
                <View style={styles.liveChip}>
                  <View style={styles.liveChipDot} />
                  <Text style={[px.label, { color: C.bg }]}>LIVE</Text>
                </View>
                <Text style={[px.label, { color: C.grey }]}>
                  RND {nextRaceIndex} · {liveRace.session_name?.toUpperCase() ?? "RACE"}
                </Text>
              </View>
              <Text style={[px.h2, { color: C.accent, marginBottom: 2 }]}>
                🏁 {(liveRace.country_name ?? "GRAND PRIX").toUpperCase().slice(0, 16)}
              </Text>
              <Text style={[px.label, { color: C.grey, marginBottom: 10 }]}>
                {(liveRace.circuit_short_name ?? "").toUpperCase()}
              </Text>
              <View style={styles.lapRow}>
                <PBox color={C.borderBright} style={styles.lapBox}>
                  <Text style={[px.label, { color: C.grey, marginBottom: 2 }]}>LAP</Text>
                  <Text style={[px.h1, { color: C.yellow }]}>{liveData.currentLap ?? "--"}<Text style={[px.label, { color: C.grey }]}>/--</Text></Text>
                </PBox>
                <PBox color={C.borderBright} style={styles.lapBox}>
                  <Text style={[px.label, { color: C.grey, marginBottom: 2 }]}>AIR</Text>
                  <Text style={[px.h2, { color: C.cyan }]}>{liveData.latestWeather?.air_temperature ? `${Math.round(liveData.latestWeather.air_temperature)}°C` : "--"}</Text>
                </PBox>
              </View>
              <View style={styles.top3Row}>
                {top3Live.map((d) => (
                  <PBox key={d.driverNumber} color={d.teamColor || C.border} style={styles.top3Card}>
                    <Text style={[px.label, { color: C.grey }]}>P{d.position}</Text>
                    <Text style={[px.h2, { color: C.white, marginTop: 2 }]}>{d.short}</Text>
                    <Text style={[px.label, { color: d.gap === "LEADER" ? C.accent : C.grey, marginTop: 4 }]} numberOfLines={1}>
                      {d.gap === "LEADER" ? "LEAD" : d.gap}
                    </Text>
                  </PBox>
                ))}
              </View>
              <View style={styles.ctaBtn}>
                <Text style={[px.label, { color: C.bg }]}>► OPEN LEADERBOARD</Text>
              </View>
            </PBox>
          </TouchableOpacity>
        )}

        {/* ── Championship — Top 3 Drivers + Constructors ── */}
        <SectionHead label="CHAMPIONSHIP" />
        <View style={styles.champGrid}>
          {/* Drivers top 3 */}
          <PBox color={C.borderBright} style={styles.champHalf}>
            <Text style={[px.label, { color: C.grey, marginBottom: 8, fontSize: 6 }]}>DRIVERS</Text>
            {driverStandings.slice(0, 3).map((d, i) => (
              <TouchableOpacity key={d.pos} onPress={() => router.push("/(tabs)/standings")} style={styles.champRow}>
                <View style={[styles.podiumDot, { backgroundColor: PODIUM_COLORS[i] }]} />
                <Text style={[px.h3, { color: d.teamColor, flex: 1 }]} numberOfLines={1}>{d.short}</Text>
                <Text style={[px.label, { color: C.yellow }]}>{d.points}</Text>
              </TouchableOpacity>
            ))}
            {driverStandings.length === 0 && <Text style={[px.label, { color: C.greyDark }]}>LOADING...</Text>}
          </PBox>

          {/* Constructors top 3 */}
          <PBox color={C.borderBright} style={styles.champHalf}>
            <Text style={[px.label, { color: C.grey, marginBottom: 8, fontSize: 6 }]}>CONSTRUCTORS</Text>
            {constructorStandings.slice(0, 3).map((c, i) => (
              <TouchableOpacity key={c.pos} onPress={() => router.push("/(tabs)/standings")} style={styles.champRow}>
                <View style={[styles.podiumDot, { backgroundColor: PODIUM_COLORS[i] }]} />
                <Text style={[px.h3, { color: c.teamColor, flex: 1 }]} numberOfLines={1}>{c.name.toUpperCase().slice(0, 8)}</Text>
                <Text style={[px.label, { color: C.yellow }]}>{c.points}</Text>
              </TouchableOpacity>
            ))}
            {constructorStandings.length === 0 && <Text style={[px.label, { color: C.greyDark }]}>LOADING...</Text>}
          </PBox>
        </View>

        {/* ── Previous Race Top 3 ── */}
        {lastRaceTop3.length > 0 && (
          <>
            <SectionHead label="LAST RACE" />
            <PBox color={C.borderBright} style={styles.lastRaceCard}>
              <View style={styles.lastRaceRow}>
                {lastRaceTop3.map((d, i) => (
                  <View key={d.pos} style={styles.podiumCard}>
                    <View style={[styles.podiumNum, { borderColor: PODIUM_COLORS[i] }]}>
                      <Text style={[px.h3, { color: PODIUM_COLORS[i] }]}>P{d.pos}</Text>
                    </View>
                    <View style={[styles.podiumStripe, { backgroundColor: d.teamColor }]} />
                    <Text style={[px.h2, { color: d.teamColor, marginTop: 4 }]}>{d.short}</Text>
                    <Text style={[px.label, { color: C.grey, marginTop: 2, fontSize: 5 }]} numberOfLines={1}>{d.team.slice(0, 8).toUpperCase()}</Text>
                  </View>
                ))}
              </View>
            </PBox>
          </>
        )}

        {/* ── Next Race ── */}
        {nextRace && (
          <>
            <SectionHead label="NEXT RACE" />
            <TouchableOpacity onPress={() => router.push("/(tabs)/schedule")} activeOpacity={0.85}>
              <PBox color={C.borderBright} style={styles.nextRaceCard}>
                <View style={styles.nextRaceTop}>
                  <View style={styles.roundBadge}>
                    <Text style={[px.label, { color: C.greyDark, fontSize: 5 }]}>RND</Text>
                    <Text style={[px.h2, { color: C.white }]}>{nextRaceIndex}</Text>
                    <Text style={[px.label, { color: C.greyDark, fontSize: 5 }]}>/ {totalRaces}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[px.h2, { color: C.accent }]}>
                      🏁 {(nextRace.country_name ?? "GRAND PRIX").toUpperCase().slice(0, 14)}
                    </Text>
                    <Text style={[px.label, { color: C.grey, marginTop: 4 }]}>
                      {(nextRace.circuit_short_name ?? "").toUpperCase()}
                    </Text>
                    <Text style={[px.label, { color: C.greyDark, marginTop: 2 }]}>
                      {nextRace.date_start ? new Date(nextRace.date_start).toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase() : "TBA"}
                    </Text>
                  </View>
                </View>

                {/* Countdown */}
                {countdown.ready && (
                  <View style={styles.countdown}>
                    <Text style={[px.label, { color: C.greyDark, marginBottom: 6 }]}>RACE WEEKEND IN</Text>
                    <View style={styles.countRow}>
                      <CountdownBox label="DAYS" value={countdown.days} />
                      <Text style={[px.h2, { color: C.greyDark }]}>:</Text>
                      <CountdownBox label="HRS" value={countdown.hours} />
                      <Text style={[px.h2, { color: C.greyDark }]}>:</Text>
                      <CountdownBox label="MIN" value={countdown.mins} />
                      <Text style={[px.h2, { color: C.greyDark }]}>:</Text>
                      <CountdownBox label="SEC" value={countdown.secs} />
                    </View>
                  </View>
                )}
              </PBox>
            </TouchableOpacity>
          </>
        )}

        {/* ── News ── */}
        <SectionHead label="NEWS" />
        <PBox color={C.border} style={styles.newsCard}>
          <Text style={[px.label, { color: C.greyDark, textAlign: "center" }]}>NO NEWS YET</Text>
          <Text style={[px.label, { color: C.greyDark, fontSize: 5, marginTop: 6, textAlign: "center" }]}>CONTENT COMING SOON</Text>
        </PBox>

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
  liveBannerTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  liveChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.accent, paddingHorizontal: 6, paddingVertical: 3 },
  liveChipDot: { width: 4, height: 4, backgroundColor: C.bg },
  lapRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  lapBox: { flex: 1, padding: 10 },
  top3Row: { flexDirection: "row", gap: 8, marginBottom: 12 },
  top3Card: { flex: 1, padding: 10 },
  ctaBtn: { backgroundColor: C.accent, padding: 10, alignItems: "center" },

  sectionHead: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 12, marginTop: 18, marginBottom: 10,
  },
  sectionTick: { width: 4, height: 16, backgroundColor: C.accent },

  champGrid: { flexDirection: "row", gap: 8, marginHorizontal: 12 },
  champHalf: { flex: 1, padding: 12 },
  champRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  podiumDot: { width: 6, height: 6 },

  lastRaceCard: { marginHorizontal: 12, padding: 14 },
  lastRaceRow: { flexDirection: "row", gap: 8 },
  podiumCard: { flex: 1, alignItems: "center" },
  podiumNum: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 4 },
  podiumStripe: { width: "100%", height: 3 },

  nextRaceCard: { marginHorizontal: 12, padding: 14 },
  nextRaceTop: { flexDirection: "row", alignItems: "flex-start", gap: 14, marginBottom: 12 },
  roundBadge: { alignItems: "center", width: 40 },

  countdown: {
    borderTopWidth: 1, borderTopColor: C.border,
    paddingTop: 12, alignItems: "center",
  },
  countRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  countCell: { alignItems: "center", minWidth: 36 },

  newsCard: { marginHorizontal: 12, padding: 20, alignItems: "center", justifyContent: "center" },
});
