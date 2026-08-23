import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { View, Text, FlatList, Image, StatusBar, StyleSheet, TouchableOpacity, SafeAreaView } from "../components/primitives";
import { getRaceStatus, parseDate, useAllSessions } from "../hooks/useOpenF1";
import { useThemeTokens } from "../theme";
import { trackOutlineSource } from "../utils/imageMaps";
import { sx } from "../utils/sx";

// Ported from f1-live/app/(tabs)/schedule.tsx

const COUNTRY_FLAGS: Record<string, string> = {
  "Australia": "🇦🇺", "Bahrain": "🇧🇭", "Saudi Arabia": "🇸🇦", "Japan": "🇯🇵",
  "China": "🇨🇳", "Miami": "🇺🇸", "United States": "🇺🇸", "Monaco": "🇲🇨",
  "Canada": "🇨🇦", "Spain": "🇪🇸", "Austria": "🇦🇹", "United Kingdom": "🇬🇧",
  "Hungary": "🇭🇺", "Belgium": "🇧🇪", "Netherlands": "🇳🇱", "Italy": "🇮🇹",
  "Azerbaijan": "🇦🇿", "Singapore": "🇸🇬", "Mexico": "🇲🇽", "Brazil": "🇧🇷",
  "Las Vegas": "🇺🇸", "Qatar": "🇶🇦", "Abu Dhabi": "🇦🇪",
};

const SESSION_DISPLAY_BY_NAME: Record<string, { label: string; colorKey: "accent" | "yellow" | "cyan" | "grey" }> = {
  "Practice 1": { label: "FP1", colorKey: "cyan" },
  "Practice 2": { label: "FP2", colorKey: "cyan" },
  "Practice 3": { label: "FP3", colorKey: "cyan" },
  "Sprint Shootout": { label: "SQ", colorKey: "accent" },
  "Sprint Qualifying": { label: "SQ", colorKey: "accent" },
  "Sprint": { label: "SPR", colorKey: "accent" },
  "Qualifying": { label: "QUAL", colorKey: "yellow" },
  "Race": { label: "RACE", colorKey: "accent" },
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
  location: string;
  flag: string;
  isSprint: boolean;
  status: "live" | "inprogress" | "done" | "upcoming";
  sessions: SessionItem[];
  earliestDate: string;
};

function sessionDisplay(s: SessionItem, C: any) {
  const byName = SESSION_DISPLAY_BY_NAME[s.session_name ?? ""];
  if (byName) return { label: byName.label, color: C[byName.colorKey] ?? C.grey };
  const fallback = (s.session_name ?? s.session_type ?? "?").slice(0, 4).toUpperCase();
  return { label: fallback, color: C.grey };
}

function SessionBadge({ label, color, status, C, px, styles }: { label: string; color: string; status: "live" | "done" | "upcoming"; C: any; px: any; styles: any }) {
  const isDone = status === "done";
  const isLive = status === "live";
  return (
    <View style={sx(styles.sessionBadge, { borderColor: isDone ? C.border : color }, isDone && { opacity: 0.4 })}>
      {isLive && <View style={sx(styles.sessionLiveDot, { backgroundColor: color })} />}
      <Text style={sx(px.label, { color: isDone ? C.greyDark : color, fontSize: 5 })}>{label}</Text>
    </View>
  );
}

function WeekendCard({ item, expanded, onPress, C, px, styles, mode }: { item: RaceWeekend; expanded: boolean; onPress: () => void; C: any; px: any; styles: any; mode: "dark" | "light" }) {
  const isDone = item.status === "done";
  const isLive = item.status === "live";
  const isInProgress = item.status === "inprogress";
  const borderColor = isLive ? C.accent : isInProgress ? C.yellow : isDone ? C.border : C.borderBright;
  const bg = isLive ? C.accentDim : isDone ? C.bgPanel : C.bgCard;
  const track = trackOutlineSource(mode, item.country, item.location, item.circuit);

  return (
    <TouchableOpacity onClick={onPress} activeOpacity={0.8}>
      <View style={sx(styles.card, { borderColor, backgroundColor: bg })}>
        <View style={sx(styles.accent, { backgroundColor: isLive ? C.accent : isInProgress ? C.yellow : isDone ? C.greyDark : C.borderBright })} />
        <View style={styles.cardMain}>
          <View style={styles.cardTop}>
            <View style={styles.roundBox}>
              <Text style={sx(px.label, { color: C.grey, fontSize: 5 })}>RND</Text>
              <Text style={sx(px.h2, { color: C.white })}>{String(item.roundNum).padStart(2, "0")}</Text>
            </View>
            {track && <Image source={track} style={styles.trackOutline} resizeMode="contain" />}
            <Text style={{ fontSize: 22 }}>{item.flag}</Text>
            <View style={styles.nameBlock}>
              <View style={styles.nameRow}>
                <Text style={sx(px.h3, { color: isLive ? C.accent : isInProgress ? C.yellow : isDone ? C.grey : C.white })}>
                  {item.country.toUpperCase().slice(0, 14)}
                </Text>
                {item.isSprint && (
                  <View style={sx(styles.sprintBadge, { backgroundColor: C.accent })}>
                    <Text style={sx(px.label, { color: C.bg, fontSize: 4 })}>SPRINT</Text>
                  </View>
                )}
                {isLive && (
                  <View style={sx(styles.livePill, { backgroundColor: C.accent })}>
                    <View style={sx(styles.livePillDot, { backgroundColor: C.bg })} />
                    <Text style={sx(px.label, { color: C.bg, fontSize: 4 })}>LIVE</Text>
                  </View>
                )}
                {isInProgress && (
                  <View style={sx(styles.inProgPill, { borderColor: C.yellow })}>
                    <Text style={{ fontSize: 8 }}>⏳</Text>
                    <Text style={sx(px.label, { color: C.yellow, fontSize: 4 })}>ON NOW</Text>
                  </View>
                )}
                {isDone && (
                  <View style={sx(styles.donePill, { borderColor: C.green })}>
                    <Text style={sx(px.label, { color: C.green, fontSize: 5 })}>✓</Text>
                  </View>
                )}
              </View>
              <Text style={sx(px.label, { color: C.greyDark, fontSize: 5, marginTop: 2 })}>
                {item.circuit.toUpperCase().slice(0, 22)}
              </Text>
              <Text style={sx(px.label, { color: isDone ? C.greyDark : C.grey, fontSize: 5, marginTop: 2 })}>
                {item.earliestDate
                  ? new Date(item.earliestDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()
                  : "TBA"}
              </Text>
            </View>
            <Text style={sx(px.label, { color: C.grey })}>{expanded ? "▲" : "▼"}</Text>
          </View>

          {expanded && (
            <View style={sx(styles.sessionsRow, { borderTopColor: C.border })}>
              {item.sessions.map((s) => {
                const now = Date.now();
                const sStatus = getRaceStatus(s, now);
                const info = sessionDisplay(s, C);
                return (
                  <SessionBadge key={s.session_key} label={info.label} color={info.color} status={sStatus} C={C} px={px} styles={styles} />
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
  const { C, px, mode, scaleValue } = useThemeTokens();
  const styles = useMemo(() => createStyles(C, scaleValue), [C, scaleValue]);
  const allSessionsQuery = useAllSessions();
  const [expanded, setExpanded] = useState<number | null>(null);
  const now = Date.now();

  const weekends = useMemo(() => {
    const sessions = (Array.isArray(allSessionsQuery.data) ? allSessionsQuery.data : []) as SessionItem[];
    const meetingMap = new Map<number, SessionItem[]>();

    for (const s of sessions) {
      const key = s.meeting_key ?? 0;
      if (!meetingMap.has(key)) meetingMap.set(key, []);
      meetingMap.get(key)!.push(s);
    }

    const result: RaceWeekend[] = [];
    let roundNum = 0;

    for (const [meetingKey, meetingSessions] of meetingMap) {
      const hasRace = meetingSessions.some((s) => s.session_type === "Race");
      if (!hasRace) continue;
      roundNum++;

      const sorted = [...meetingSessions].sort((a, b) => parseDate(a.date_start) - parseDate(b.date_start));
      const first = sorted[0];
      const country = first?.country_name ?? first?.meeting_name ?? "Grand Prix";
      const circuit = first?.circuit_short_name ?? first?.location ?? "Circuit";
      const location = first?.location ?? "";
      const isSprint = meetingSessions.some((s) =>
        s.session_type === "Sprint" ||
        s.session_type === "Sprint Shootout" ||
        s.session_type === "Sprint Qualifying" ||
        s.session_name?.toLowerCase().includes("sprint")
      );
      const raceSession = meetingSessions.find((s) => s.session_type === "Race");
      const raceStatus = raceSession ? getRaceStatus(raceSession, now) : "upcoming";
      const started = parseDate(first?.date_start) > 0 && now >= parseDate(first?.date_start);
      const weekendStatus: RaceWeekend["status"] =
        raceStatus === "done" ? "done"
        : raceStatus === "live" ? "live"
        : started ? "inprogress"
        : "upcoming";

      result.push({
        meetingKey,
        roundNum,
        country,
        circuit,
        location,
        flag: COUNTRY_FLAGS[country] ?? "🏁",
        isSprint,
        status: weekendStatus,
        sessions: sorted,
        earliestDate: first?.date_start ?? "",
      });
    }

    return result.sort((a, b) => parseDate(a.earliestDate) - parseDate(b.earliestDate));
  }, [allSessionsQuery.data, now]);

  const currentMeetingKey = weekends.find((w) => w.status === "live" || w.status === "inprogress")?.meetingKey;
  useEffect(() => {
    if (currentMeetingKey != null) setExpanded(currentMeetingKey);
  }, [currentMeetingKey]);

  const done = weekends.filter((w) => w.status === "done").length;
  const total = weekends.length;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar backgroundColor={C.bg} />

      <View style={sx(styles.header, { borderBottomColor: C.accent })}>
        <Text style={px.h1}>SCHEDULE</Text>
        <View>
          <Text style={sx(px.label, { color: C.accent })}>{done}/{total}</Text>
          <Text style={sx(px.label, { color: C.grey })}>RACES DONE</Text>
        </View>
      </View>

      {weekends.length > 0 && (
        <View style={sx(styles.progressBar, { backgroundColor: C.bgPanel, borderBottomColor: C.border })}>
          {weekends.map((w) => (
            <View
              key={w.meetingKey}
              style={sx(styles.progressSeg, {
                backgroundColor: w.status === "done" ? C.green : w.status === "live" ? C.accent : w.status === "inprogress" ? C.yellow : C.border,
              })}
            />
          ))}
        </View>
      )}

      {allSessionsQuery.isLoading && weekends.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={sx(px.label, { color: C.greyDark })}>LOADING...</Text>
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
              C={C}
              px={px}
              styles={styles}
              mode={mode}
            />
          )}
          contentContainerStyle={{ padding: 10, gap: 8, paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

function createStyles(C: any, scale: number) {
  const s = Math.max(0.9, Math.min(1.2, scale));
  const m = (n: number) => Math.round(n * s);
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg, minHeight: 0 } as CSSProperties,
    header: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      padding: m(16), paddingBottom: m(10), borderBottomWidth: 2,
    } as CSSProperties,
    progressBar: {
      flexDirection: "row", gap: 2,
      paddingLeft: m(10), paddingRight: m(10), paddingTop: m(8), paddingBottom: m(8),
      borderBottomWidth: 1,
    } as CSSProperties,
    progressSeg: { flex: 1, height: m(8) } as CSSProperties,
    card: { borderWidth: 2, flexDirection: "row", overflow: "hidden" } as CSSProperties,
    accent: { width: 4 } as CSSProperties,
    cardMain: { flex: 1, padding: m(10) } as CSSProperties,
    cardTop: { flexDirection: "row", alignItems: "center", gap: m(10) } as CSSProperties,
    roundBox: { alignItems: "center", width: m(30) } as CSSProperties,
    trackOutline: { width: m(54), height: m(28) } as CSSProperties,
    nameBlock: { flex: 1 } as CSSProperties,
    nameRow: { flexDirection: "row", alignItems: "center", gap: m(6), flexWrap: "wrap" } as CSSProperties,
    sprintBadge: { paddingLeft: m(4), paddingRight: m(4), paddingTop: m(2), paddingBottom: m(2) } as CSSProperties,
    livePill: { flexDirection: "row", alignItems: "center", gap: m(3), paddingLeft: m(4), paddingRight: m(4), paddingTop: m(2), paddingBottom: m(2) } as CSSProperties,
    livePillDot: { width: 4, height: 4 } as CSSProperties,
    donePill: { borderWidth: 1, paddingLeft: m(4), paddingRight: m(4), paddingTop: m(1), paddingBottom: m(1) } as CSSProperties,
    inProgPill: { flexDirection: "row", alignItems: "center", gap: m(3), borderWidth: 1, paddingLeft: m(4), paddingRight: m(4), paddingTop: m(1), paddingBottom: m(1) } as CSSProperties,
    sessionsRow: { flexDirection: "row", flexWrap: "wrap", gap: m(6), marginTop: m(10), paddingTop: m(8), borderTopWidth: 1 } as CSSProperties,
    sessionBadge: { borderWidth: 1, paddingLeft: m(6), paddingRight: m(6), paddingTop: m(4), paddingBottom: m(4), minWidth: m(38), alignItems: "center", position: "relative" } as CSSProperties,
    sessionLiveDot: { position: "absolute", top: 2, right: 2, width: 4, height: 4 } as CSSProperties,
  });
}
