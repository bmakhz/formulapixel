import React, { useState } from "react";
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { schedule, Race, RaceSession } from "../../data/mockData";
import { C, px } from "../../components/theme";

const SESSION_COLORS: Record<string, string> = {
  FP1: "#4488ff", FP2: "#4488ff", FP3: "#4488ff",
  Q:   C.yellow,  SQ:  C.yellow,
  R:   C.accent,  SR:  C.accent,
};

const SESSION_LABELS: Record<string, string> = {
  FP1: "FP1", FP2: "FP2", FP3: "FP3",
  Q: "QUAL", SQ: "S.QUAL",
  R: "RACE", SR: "S.RACE",
};

function SessionBadge({ session }: { session: RaceSession }) {
  const color = SESSION_COLORS[session.type] ?? C.grey;
  const isDone = session.status === "done";
  const isLive = session.status === "live";
  return (
    <View style={[
      styles.sessionBadge,
      { borderColor: isDone ? C.border : isLive ? color : C.borderBright },
      isDone && styles.sessionDone,
    ]}>
      <Text style={[px.label, {
        color: isDone ? C.greyDark : isLive ? color : C.grey,
        fontSize: 5,
      }]}>
        {SESSION_LABELS[session.type]}
      </Text>
      <Text style={[px.label, { color: C.greyDark, fontSize: 5 }]}>{session.time}</Text>
      {isLive && <View style={styles.sessionLiveDot} />}
    </View>
  );
}

function RaceCard({
  item,
  expanded,
  onPress,
}: {
  item: Race;
  expanded: boolean;
  onPress: () => void;
}) {
  const isDone = item.status === "done";
  const isLive = item.status === "live";

  const borderColor = isLive ? C.accent : isDone ? C.border : C.borderBright;
  const bg = isLive ? "#1a0005" : isDone ? C.bgPanel : C.bgCard;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.raceCard, { borderColor, backgroundColor: bg }]}>

        {/* Left accent bar */}
        <View style={[styles.raceAccent, {
          backgroundColor: isLive ? C.accent : isDone ? C.greyDark : C.borderBright,
        }]} />

        {/* Main row */}
        <View style={styles.raceMain}>
          <View style={styles.raceTop}>
            {/* Round + flag */}
            <View style={styles.roundBox}>
              <Text style={[px.label, { color: C.grey, fontSize: 5 }]}>RND</Text>
              <Text style={[px.h2, { color: C.white }]}>{String(item.round).padStart(2, "0")}</Text>
            </View>

            <Text style={{ fontSize: 22 }}>{item.flag}</Text>

            <View style={styles.raceNameCol}>
              <View style={styles.raceNameRow}>
                <Text style={[px.h3, { color: isLive ? C.accent : isDone ? C.grey : C.white }]}>
                  {item.shortName}
                </Text>
                {isLive && (
                  <View style={styles.livePill}>
                    <View style={styles.livePillDot} />
                    <Text style={[px.label, { color: C.bg, fontSize: 5 }]}>LIVE</Text>
                  </View>
                )}
                {isDone && item.winner && (
                  <View style={styles.winnerBadge}>
                    <Text style={[px.label, { color: C.yellow, fontSize: 5 }]}>W:{item.winner}</Text>
                  </View>
                )}
              </View>
              <Text style={[px.label, { color: C.greyDark, fontSize: 5, marginTop: 2 }]}>
                {item.circuit.toUpperCase().slice(0, 24)}
              </Text>
              <Text style={[px.label, { color: isDone ? C.greyDark : C.grey, fontSize: 5, marginTop: 2 }]}>
                {item.dates.toUpperCase()}
              </Text>
            </View>

            <Text style={[px.label, { color: C.grey, fontSize: 5 }]}>
              {expanded ? "▲" : "▼"}
            </Text>
          </View>

          {/* Expanded sessions */}
          {expanded && (
            <View style={styles.sessionsGrid}>
              {item.sessions.map((s) => (
                <SessionBadge key={s.type} session={s} />
              ))}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ScheduleScreen() {
  const [expanded, setExpanded] = useState<number | null>(
    schedule.find((r) => r.status === "live")?.round ?? null
  );

  const done = schedule.filter((r) => r.status === "done").length;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[px.h1]}>SCHEDULE</Text>
        <View style={styles.headerRight}>
          <View style={styles.progressInfo}>
            <Text style={[px.label, { color: C.accent }]}>
              {done}/{schedule.length}
            </Text>
            <Text style={[px.label, { color: C.grey }]}>RACES DONE</Text>
          </View>
        </View>
      </View>

      {/* Progress pixel bar */}
      <View style={styles.progressBar}>
        {schedule.map((r) => (
          <View
            key={r.round}
            style={[
              styles.progressSeg,
              {
                backgroundColor:
                  r.status === "done" ? C.green
                  : r.status === "live" ? C.accent
                  : C.border,
              },
            ]}
          />
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {[
          { color: C.green, label: "DONE" },
          { color: C.accent, label: "LIVE" },
          { color: C.border, label: "UPCOMING" },
        ].map((l) => (
          <View key={l.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: l.color }]} />
            <Text style={[px.label, { color: C.grey, fontSize: 5 }]}>{l.label}</Text>
          </View>
        ))}
        <Text style={[px.label, { color: C.greyDark, fontSize: 5 }]}>TAP TO EXPAND</Text>
      </View>

      <FlatList
        data={schedule}
        keyExtractor={(r) => String(r.round)}
        renderItem={({ item }) => (
          <RaceCard
            item={item}
            expanded={expanded === item.round}
            onPress={() => setExpanded(expanded === item.round ? null : item.round)}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 10, gap: 8, paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", padding: 16, paddingBottom: 10,
    borderBottomWidth: 2, borderBottomColor: C.accent,
  },
  headerRight: {},
  progressInfo: { alignItems: "flex-end", gap: 2 },

  progressBar: {
    flexDirection: "row", gap: 2,
    paddingHorizontal: 10, paddingVertical: 8,
    backgroundColor: C.bgPanel,
  },
  progressSeg: { flex: 1, height: 8 },

  legend: {
    flexDirection: "row", alignItems: "center", gap: 16,
    paddingHorizontal: 10, paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8 },

  raceCard: {
    borderWidth: 2, borderRadius: 0,
    flexDirection: "row", overflow: "hidden",
  },
  raceAccent: { width: 4 },
  raceMain: { flex: 1, padding: 10 },

  raceTop: {
    flexDirection: "row", alignItems: "center", gap: 10,
  },
  roundBox: { alignItems: "center", width: 30 },
  raceNameCol: { flex: 1 },
  raceNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },

  livePill: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: C.accent, paddingHorizontal: 4, paddingVertical: 2,
  },
  livePillDot: { width: 4, height: 4, backgroundColor: C.bg },

  winnerBadge: {
    backgroundColor: "#1a1500", borderWidth: 1,
    borderColor: C.yellow, paddingHorizontal: 4, paddingVertical: 1,
  },

  sessionsGrid: {
    flexDirection: "row", flexWrap: "wrap",
    gap: 6, marginTop: 10,
    paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border,
  },
  sessionBadge: {
    borderWidth: 1, paddingHorizontal: 6, paddingVertical: 4,
    alignItems: "center", gap: 2, minWidth: 50,
  },
  sessionDone: { opacity: 0.4 },
  sessionLiveDot: {
    width: 4, height: 4, backgroundColor: C.accent,
    position: "absolute", top: 2, right: 2,
  },
});
