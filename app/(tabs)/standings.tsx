import React, { useState } from "react";
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDriverStandings, useConstructorStandings } from "../../hooks/useOpenF1";
import { C, px } from "../../components/theme";

type Tab = "drivers" | "constructors";

const PODIUM_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];

function DriverRow({ item }: { item: { pos: number; name: string; short: string; team: string; teamColor: string; points: number; wins: number } }) {
  return (
    <View style={styles.row}>
      {/* Position */}
      <View style={[styles.posBox, { borderColor: item.pos <= 3 ? PODIUM_COLORS[item.pos - 1] : C.border }]}>
        <Text style={[px.h3, { color: item.pos <= 3 ? PODIUM_COLORS[item.pos - 1] : C.grey }]}>
          {String(item.pos).padStart(2, "0")}
        </Text>
      </View>

      {/* Team stripe */}
      <View style={[styles.stripe, { backgroundColor: item.teamColor }]} />

      {/* Name + Team */}
      <View style={styles.nameCol}>
        <Text style={[px.h3, { color: item.teamColor || C.white }]}>{item.name}</Text>
        <Text style={[px.label, { color: C.greyDark, marginTop: 3, fontSize: 5 }]}>
          {item.team.toUpperCase()}
        </Text>
      </View>

      {/* Points */}
      <View style={styles.ptsBox}>
        <Text style={[px.h2, { color: C.yellow }]}>{item.points}</Text>
        <Text style={[px.label, { color: C.greyDark, fontSize: 5 }]}>PTS</Text>
      </View>
    </View>
  );
}

function ConstructorRow({ item }: { item: { pos: number; name: string; teamColor: string; points: number; wins: number } }) {
  return (
    <View style={styles.row}>
      <View style={[styles.posBox, { borderColor: item.pos <= 3 ? PODIUM_COLORS[item.pos - 1] : C.border }]}>
        <Text style={[px.h3, { color: item.pos <= 3 ? PODIUM_COLORS[item.pos - 1] : C.grey }]}>
          {String(item.pos).padStart(2, "0")}
        </Text>
      </View>
      <View style={[styles.stripe, { backgroundColor: item.teamColor }]} />
      <View style={styles.nameCol}>
        <Text style={[px.h3, { color: item.teamColor || C.white }]}>{item.name.toUpperCase()}</Text>
      </View>
      <View style={styles.ptsBox}>
        <Text style={[px.h2, { color: C.yellow }]}>{item.points}</Text>
        <Text style={[px.label, { color: C.greyDark, fontSize: 5 }]}>PTS</Text>
      </View>
    </View>
  );
}

export default function StandingsScreen() {
  const [tab, setTab] = useState<Tab>("drivers");
  const driverQuery = useDriverStandings();
  const constructorQuery = useConstructorStandings();

  const driverStandings = driverQuery.data ?? [];
  const constructorStandings = constructorQuery.data ?? [];

  const leader = tab === "drivers"
    ? driverStandings[0]
    : constructorStandings[0];

  const isLoading = tab === "drivers" ? driverQuery.isLoading : constructorQuery.isLoading;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[px.h1]}>STANDINGS</Text>
        <Text style={[px.label, { color: C.accent }]}>{new Date().getFullYear()} SEASON</Text>
      </View>

      {/* Tab selector */}
      <View style={styles.tabRow}>
        {(["drivers", "constructors"] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[px.label, { color: tab === t ? C.bg : C.grey }]}>
              {t === "drivers" ? "DRIVERS" : "CONSTRUCTORS"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Leader banner */}
      {leader && (
        <View style={[styles.leaderBanner, { borderColor: leader.teamColor }]}>
          <View style={[styles.leaderStripe, { backgroundColor: leader.teamColor }]} />
          <View style={styles.leaderLeft}>
            <Text style={[px.label, { color: C.grey }]}>CHAMPIONSHIP LEADER</Text>
            <Text style={[px.h1, { color: leader.teamColor, marginTop: 4 }]}>
              {"name" in leader ? leader.name : leader.name}
            </Text>
          </View>
          <Text style={[px.h1, { color: C.yellow, fontSize: 20 }]}>{leader.points}</Text>
        </View>
      )}

      {/* Column headers */}
      <View style={styles.colHeader}>
        <Text style={[px.label, { width: 40, fontSize: 6 }]}>POS</Text>
        <Text style={[px.label, { flex: 1, fontSize: 6 }]}>
          {tab === "drivers" ? "DRIVER" : "TEAM"}
        </Text>
        <Text style={[px.label, { width: 56, textAlign: "right", fontSize: 6 }]}>PTS</Text>
      </View>

      {isLoading && (
        <View style={{ padding: 24, alignItems: "center" }}>
          <Text style={[px.label, { color: C.greyDark }]}>LOADING SEASON DATA...</Text>
        </View>
      )}

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
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 16, paddingBottom: 12,
    borderBottomWidth: 2, borderBottomColor: C.accent,
  },
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
    paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: C.bg,
  },
  posBox: {
    width: 32, height: 32, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
    marginRight: 6,
  },
  stripe: { width: 3, height: 36, marginRight: 10 },
  nameCol: { flex: 1 },
  ptsBox: { width: 56, alignItems: "flex-end" },
});
