import React, { useState, useMemo } from "react";
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAllSessions, getRaceStatus, parseDate } from "../../hooks/useOpenF1";
import { C, px } from "../../components/theme";

const COUNTRY_FLAGS: Record<string, string> = {
  "Australia": "🇦🇺", "Bahrain": "🇧🇭", "Saudi Arabia": "🇸🇦", "Japan": "🇯🇵",
  "China": "🇨🇳", "Miami": "🇺🇸", "United States": "🇺🇸", "Monaco": "🇲🇨",
  "Canada": "🇨🇦", "Spain": "🇪🇸", "Austria": "🇦🇹", "United Kingdom": "🇬🇧",
  "Hungary": "🇭🇺", "Belgium": "🇧🇪", "Netherlands": "🇳🇱", "Italy": "🇮🇹",
  "Azerbaijan": "🇦🇿", "Singapore": "🇸🇬", "Mexico": "🇲🇽", "Brazil": "🇧🇷",
  "Las Vegas": "🇺🇸", "Qatar": "🇶🇦", "Abu Dhabi": "🇦🇪",
};

// Known sprint weekends for 2025 season (country names)
const SPRINT_WEEKENDS = new Set([
  "China", "Miami", "Belgium", "United States", "Brazil", "Qatar",
]);

// Session type display info
const SESSION_DISPLAY: Record<string, { label: string; color: string }> = {
  "Practice 1": { label: "FP1", color: "#4488ff" },
  "Practice 2": { label: "FP2", color: "#4488ff" },
  "Practice 3": { label: "FP3", color: "#4488ff" },
  "Sprint Shootout": { label: "SQ", color: "#ff6600" },
  "Sprint Qualifying": { label: "SQ", color: "#ff6600" },
  "Sprint": { label: "SPR", color: "#ff6600" },
  "Qualifying": { label: "QUAL", color: C.yellow },
  "Race": { label: "RACE", color: C.accent },
};

type SessionItem = {
  session_key: number;
  session_name?: string;
  session_type?: string;
  date_start?: string;
  date_end?: string;
  country_name?: string;
  meeting_name?: string;
  circuit_short_name?: string;
  location?: string;
  meeting_key?: number;
};

type RaceWeekend = {
  meetingKey: number;
  roundNum: number;
  country: string;
  circuit: string;
  flag: string;
  isSprint: boolean;
  status: "live" | "done" | "upcoming";
  sessions: SessionItem[];
  earliestDate: string;
};

function SessionBadge({ label, color, status }: { label: string; color: string; status: "live" | "done" | "upcoming" }) {
  const isDone = status === "done";
  const isLive = status === "live";
  return (
    <View style={[
      styles.sessionBadge,
      { borderColor: isDone ? C.border : color },
      isDone && { opacity: 0.4 },
    ]}>
      {isLive && <View style={[styles.sessionLiveDot, { backgroundColor: color }]} />}
      <Text style={[px.label, { color: isDone ? C.greyDark : color, fontSize: 5 }]}>{label}</Text>
    </View>
  );
}

function WeekendCard({
  item, expanded, onPress,
}: { item: RaceWeekend; expanded: boolean; onPress: () => void }) {
  const isDone = item.status === "done";
  const isLive = item.status === "live";
  const borderColor = isLive ? C.accent : isDone ? C.border : C.borderBright;
  const bg = isLive ? "#1a0005" : isDone ? C.bgPanel : C.bgCard;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.card, { borderColor, backgroundColor: bg }]}>
        {/* Left accent */}
        <View style={[styles.accent, { backgroundColor: isLive ? C.accent : isDone ? C.greyDark : C.borderBright }]} />

        <View style={styles.cardMain}>
          {/* Top row */}
          <View style={styles.cardTop}>
            <View style={styles.roundBox}>
              <Text style={[px.label, { color: C.grey, fontSize: 5 }]}>RND</Text>
              <Text style={[px.h2, { color: C.white }]}>{String(item.roundNum).padStart(2, "0")}</Text>
            </View>

            <Text style={{ fontSize: 22 }}>{item.flag}</Text>

            <View style={styles.nameBlock}>
              <View style={styles.nameRow}>
                <Text style={[px.h3, { color: isLive ? C.accent : isDone ? C.grey : C.white }]}>
                  {item.country.toUpperCase().slice(0, 14)}
                </Text>
                {item.isSprint && (
                  <View style={styles.sprintBadge}>
                    <Text style={[px.label, { color: C.bg, fontSize: 4 }]}>SPRINT</Text>
                  </View>
                )}
                {isLive && (
                  <View style={styles.livePill}>
                    <View style={styles.livePillDot} />
                    <Text style={[px.label, { color: C.bg, fontSize: 4 }]}>LIVE</Text>
                  </View>
                )}
                {isDone && (
                  <View style={styles.donePill}>
                    <Text style={[px.label, { color: C.green, fontSize: 5 }]}>✓</Text>
                  </View>
                )}
              </View>
              <Text style={[px.label, { color: C.greyDark, fontSize: 5, marginTop: 2 }]}>
                {item.circuit.toUpperCase().slice(0, 22)}
              </Text>
              <Text style={[px.label, { color: isDone ? C.greyDark : C.grey, fontSize: 5, marginTop: 2 }]}>
                {item.earliestDate
                  ? new Date(item.earliestDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()
                  : "TBA"}
              </Text>
            </View>

            <Text style={[px.label, { color: C.grey }]}>{expanded ? "▲" : "▼"}</Text>
          </View>

          {/* Expanded sessions */}
          {expanded && (
            <View style={styles.sessionsRow}>
              {item.sessions.map((s) => {
                const now = Date.now();
                const sStatus = getRaceStatus(s, now);
                const info = SESSION_DISPLAY[s.session_name ?? ""] ?? { label: (s.session_name ?? "?").slice(0, 4).toUpperCase(), color: C.grey };
                return (
                  <SessionBadge key={s.session_key} label={info.label} color={info.color} status={sStatus} />
                );
              })}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ScheduleScreen() {
  const allSessionsQuery = useAllSessions();
  const [expanded, setExpanded] = useState<number | null>(null);
  const now = Date.now();

  const weekends = useMemo(() => {
    const sessions = (Array.isArray(allSessionsQuery.data) ? allSessionsQuery.data : []) as SessionItem[];

    // Group by meeting_key
    const meetingMap = new Map<number, SessionItem[]>();
    for (const s of sessions) {
      const key = s.meeting_key ?? 0;
      if (!meetingMap.has(key)) meetingMap.set(key, []);
      meetingMap.get(key)!.push(s);
    }

    const result: RaceWeekend[] = [];
    let roundNum = 0;

    for (const [meetingKey, meetingSessions] of meetingMap) {
      // Only include meetings that have a Race session
      const hasRace = meetingSessions.some((s) => s.session_type === "Race");
      if (!hasRace) continue;

      roundNum++;

      // Sort sessions by date
      const sorted = [...meetingSessions].sort((a, b) => parseDate(a.date_start) - parseDate(b.date_start));
      const first = sorted[0];
      const country = first?.country_name ?? first?.meeting_name ?? "Grand Prix";
      const circuit = first?.circuit_short_name ?? first?.location ?? "Circuit";
      const isSprint = SPRINT_WEEKENDS.has(country) || meetingSessions.some((s) =>
        s.session_type === "Sprint" || s.session_name?.toLowerCase().includes("sprint")
      );

      // Overall weekend status = status of Race session
      const raceSession = meetingSessions.find((s) => s.session_type === "Race");
      const weekendStatus = raceSession ? getRaceStatus(raceSession, now) : "upcoming";

      result.push({
        meetingKey,
        roundNum,
        country,
        circuit,
        flag: COUNTRY_FLAGS[country] ?? "🏁",
        isSprint,
        status: weekendStatus,
        sessions: sorted,
        earliestDate: first?.date_start ?? "",
      });
    }

    return result.sort((a, b) => parseDate(a.earliestDate) - parseDate(b.earliestDate));
  }, [allSessionsQuery.data]);

  // Auto-expand live weekend
  React.useEffect(() => {
    const live = weekends.find((w) => w.status === "live");
    if (live) setExpanded(live.meetingKey);
  }, [weekends.length]);

  const done = weekends.filter((w) => w.status === "done").length;
  const total = weekends.length;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[px.h1]}>SCHEDULE</Text>
        <View>
          <Text style={[px.label, { color: C.accent }]}>{done}/{total}</Text>
          <Text style={[px.label, { color: C.grey }]}>RACES DONE</Text>
        </View>
      </View>

      {/* Pixel progress bar */}
      {weekends.length > 0 && (
        <View style={styles.progressBar}>
          {weekends.map((w) => (
            <View key={w.meetingKey} style={[styles.progressSeg, {
              backgroundColor: w.status === "done" ? C.green : w.status === "live" ? C.accent : C.border,
            }]} />
          ))}
        </View>
      )}

      {allSessionsQuery.isLoading && weekends.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={[px.label, { color: C.greyDark }]}>LOADING...</Text>
        </View>
      ) : (
        <FlatList
          data={weekends}
          keyExtractor={(w) => String(w.meetingKey)}
          renderItem={({ item }) => (
            <WeekendCard
              item={item}
              expanded={expanded === item.meetingKey}
              onPress={() => setExpanded(expanded === item.meetingKey ? null : item.meetingKey)}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 10, gap: 8, paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 16, paddingBottom: 10,
    borderBottomWidth: 2, borderBottomColor: C.accent,
  },
  progressBar: {
    flexDirection: "row", gap: 2,
    paddingHorizontal: 10, paddingVertical: 8,
    backgroundColor: C.bgPanel,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  progressSeg: { flex: 1, height: 8 },

  card: { borderWidth: 2, flexDirection: "row", overflow: "hidden" },
  accent: { width: 4 },
  cardMain: { flex: 1, padding: 10 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  roundBox: { alignItems: "center", width: 30 },
  nameBlock: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },

  sprintBadge: { backgroundColor: "#ff6600", paddingHorizontal: 4, paddingVertical: 2 },
  livePill: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: C.accent, paddingHorizontal: 4, paddingVertical: 2 },
  livePillDot: { width: 4, height: 4, backgroundColor: C.bg },
  donePill: { borderWidth: 1, borderColor: C.green, paddingHorizontal: 4, paddingVertical: 1 },

  sessionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border },
  sessionBadge: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 4, minWidth: 38, alignItems: "center", position: "relative" },
  sessionLiveDot: { position: "absolute", top: 2, right: 2, width: 4, height: 4 },
});
