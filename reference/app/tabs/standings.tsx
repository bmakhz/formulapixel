import React, { useState } from "react";
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  driverStandings, constructorStandings,
  TEAM_COLORS, DriverStanding, ConstructorStanding,
} from "../../data/mockData";
import { C, px } from "../../components/theme";

const MAX_PTS = 480;

function PixelBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(value / max, 1);
  const totalBlocks = 20;
  const filled = Math.round(pct * totalBlocks);
  return (
    <View style={styles.barWrap}>
      {Array.from({ length: totalBlocks }).map((_, i) => (
        <View
          key={i}
          style={[styles.barBlock, { backgroundColor: i < filled ? color : C.border }]}
        />
      ))}
    </View>
  );
}

function DriverRow({ item }: { item: DriverStanding }) {
  const color = TEAM_COLORS[item.team] ?? C.grey;
  const podiumColors = ["#FFD700", "#C0C0C0", "#CD7F32"];

  return (
    <View style={styles.row}>
      {/* pos square */}
      <View style={[styles.posBox, { borderColor: item.pos <= 3 ? podiumColors[item.pos - 1] : C.border }]}>
        <Text style={[px.h3, { color: item.pos <= 3 ? podiumColors[item.pos - 1] : C.grey }]}>
          {String(item.pos).padStart(2, "0")}
        </Text>
      </View>

      {/* team stripe */}
      <View style={[styles.stripe, { backgroundColor: color }]} />

      {/* name + bar */}
      <View style={styles.nameCol}>
        <View style={styles.nameRow}>
          <Text style={[px.h2, { color }]}>{item.short}</Text>
          <Text style={[px.label, { color: C.grey }]}>{item.team.toUpperCase().slice(0, 10)}</Text>
          {item.wins > 0 && (
            <View style={styles.winsBadge}>
              <Text style={[px.label, { color: C.bg, fontSize: 5 }]}>{item.wins}W</Text>
            </View>
          )}
        </View>
        <PixelBar value={item.points} max={MAX_PTS} color={color} />
      </View>

      {/* points */}
      <View style={styles.ptsBox}>
        <Text style={[px.h2, { color: C.yellow }]}>{item.points}</Text>
        <Text style={[px.label, { color: C.greyDark, fontSize: 5 }]}>PTS</Text>
      </View>
    </View>
  );
}

function ConstructorRow({ item }: { item: ConstructorStanding }) {
  const podiumColors = ["#FFD700", "#C0C0C0", "#CD7F32"];

  return (
    <View style={styles.row}>
      <View style={[styles.posBox, { borderColor: item.pos <= 3 ? podiumColors[item.pos - 1] : C.border }]}>
        <Text style={[px.h3, { color: item.pos <= 3 ? podiumColors[item.pos - 1] : C.grey }]}>
          {String(item.pos).padStart(2, "0")}
        </Text>
      </View>
      <View style={[styles.stripe, { backgroundColor: item.color }]} />
      <View style={styles.nameCol}>
        <View style={styles.nameRow}>
          <Text style={[px.h2, { color: item.color }]}>{item.name.toUpperCase()}</Text>
          {item.wins > 0 && (
            <View style={styles.winsBadge}>
              <Text style={[px.label, { color: C.bg, fontSize: 5 }]}>{item.wins}W</Text>
            </View>
          )}
        </View>
        <PixelBar value={item.points} max={MAX_PTS} color={item.color} />
      </View>
      <View style={styles.ptsBox}>
        <Text style={[px.h2, { color: C.yellow }]}>{item.points}</Text>
        <Text style={[px.label, { color: C.greyDark, fontSize: 5 }]}>PTS</Text>
      </View>
    </View>
  );
}

type Tab = "drivers" | "constructors";

export default function StandingsScreen() {
  const [tab, setTab] = useState<Tab>("drivers");
  const leader = tab === "drivers" ? driverStandings[0] : null;
  const conLeader = tab === "constructors" ? constructorStandings[0] : null;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[px.h1]}>STANDINGS</Text>
        <View style={styles.headerRight}>
          <Text style={[px.label, { color: C.accent }]}>2024 SEASON</Text>
        </View>
      </View>

      {/* Tab selector - pixel style */}
      <View style={styles.tabRow}>
        {(["drivers", "constructors"] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[px.label, { color: tab === t ? C.bg : C.grey }]}>
              {t === "drivers" ? "DRIVERS" : "CONSTRS"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Leader banner */}
      {leader && (
        <View style={[styles.leaderBanner, { borderColor: TEAM_COLORS[leader.team] }]}>
          <View style={[styles.leaderStripe, { backgroundColor: TEAM_COLORS[leader.team] }]} />
          <View style={styles.leaderLeft}>
            <Text style={[px.label, { color: C.grey }]}>CHAMPIONSHIP LEADER</Text>
            <Text style={[px.h1, { color: TEAM_COLORS[leader.team], marginTop: 4 }]}>{leader.short}</Text>
            <Text style={[px.label, { color: C.grey, marginTop: 2 }]}>
              {leader.team.toUpperCase()} · {leader.wins}W · {leader.podiums} POD
            </Text>
          </View>
          <Text style={[px.h1, { color: C.yellow, fontSize: 18 }]}>{leader.points}</Text>
        </View>
      )}
      {conLeader && (
        <View style={[styles.leaderBanner, { borderColor: conLeader.color }]}>
          <View style={[styles.leaderStripe, { backgroundColor: conLeader.color }]} />
          <View style={styles.leaderLeft}>
            <Text style={[px.label, { color: C.grey }]}>CHAMPIONSHIP LEADER</Text>
            <Text style={[px.h1, { color: conLeader.color, marginTop: 4 }]}>{conLeader.name.toUpperCase()}</Text>
            <Text style={[px.label, { color: C.grey, marginTop: 2 }]}>{conLeader.wins} WINS</Text>
          </View>
          <Text style={[px.h1, { color: C.yellow, fontSize: 18 }]}>{conLeader.points}</Text>
        </View>
      )}

      {/* Column headers */}
      <View style={styles.colHeader}>
        <Text style={[px.label, { width: 40, fontSize: 6 }]}>POS</Text>
        <Text style={[px.label, { flex: 1, fontSize: 6 }]}>NAME</Text>
        <Text style={[px.label, { width: 56, textAlign: "right", fontSize: 6 }]}>PTS</Text>
      </View>

      {tab === "drivers" ? (
        <FlatList
          data={driverStandings}
          keyExtractor={(d) => String(d.pos)}
          renderItem={({ item }) => <DriverRow item={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      ) : (
        <FlatList
          data={constructorStandings}
          keyExtractor={(d) => String(d.pos)}
          renderItem={({ item }) => <ConstructorRow item={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", padding: 16, paddingBottom: 12,
    borderBottomWidth: 2, borderBottomColor: C.accent,
  },
  headerRight: {},

  tabRow: {
    flexDirection: "row", margin: 12,
    borderWidth: 2, borderColor: C.borderBright,
  },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: "center" },
  tabBtnActive: { backgroundColor: C.accent },

  leaderBanner: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginHorizontal: 12, marginBottom: 8,
    borderWidth: 2, backgroundColor: C.bgCard,
    padding: 12,
  },
  leaderStripe: { width: 4, height: "100%", position: "absolute", left: 0, top: 0 },
  leaderLeft: { flex: 1, paddingLeft: 10 },

  colHeader: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: C.borderBright,
    backgroundColor: C.bgPanel,
  },
  sep: { height: 1, backgroundColor: C.border },

  row: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: C.bg,
  },
  posBox: {
    width: 32, height: 32, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
    marginRight: 6,
  },
  stripe: { width: 3, height: 36, marginRight: 10 },
  nameCol: { flex: 1, gap: 6 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  winsBadge: {
    backgroundColor: C.yellow, paddingHorizontal: 4, paddingVertical: 1,
  },
  ptsBox: { width: 56, alignItems: "flex-end" },

  barWrap: { flexDirection: "row", gap: 1 },
  barBlock: { width: 8, height: 4 },
});
