import { useMemo, useState, type CSSProperties } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, StatusBar, Image, SafeAreaView } from "../components/primitives";
import { useDriverStandings, useConstructorStandings } from "../hooks/useOpenF1";
import { useThemeTokens } from "../theme";
import { teamLogoSource } from "../utils/imageMaps";
import { sx } from "../utils/sx";

// Ported from f1-live/app/(tabs)/standings.tsx

type Tab = "drivers" | "constructors";
const PODIUM_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];

function DriverRow({ item, C, px, styles }: { item: { pos: number; name: string; short: string; team: string; teamColor: string; points: number; wins: number }; C: any; px: any; styles: any }) {
  const logo = teamLogoSource(item.team);
  return (
    <View style={styles.row}>
      <View style={sx(styles.posBox, { borderColor: item.pos <= 3 ? PODIUM_COLORS[item.pos - 1] : C.border })}>
        <Text style={sx(px.h3, { color: item.pos <= 3 ? PODIUM_COLORS[item.pos - 1] : C.grey })}>
          {String(item.pos).padStart(2, "0")}
        </Text>
      </View>
      {logo ? <Image source={logo} style={styles.logo} resizeMode="contain" /> : <View style={sx(styles.stripe, { backgroundColor: item.teamColor })} />}
      <View style={styles.nameCol}>
        <Text style={sx(px.h3, { color: item.teamColor || C.white })}>{item.name}</Text>
        <Text style={sx(px.label, { color: C.greyDark, marginTop: 3, fontSize: 5 })}>{item.team.toUpperCase()}</Text>
      </View>
      <View style={styles.ptsBox}>
        <Text style={sx(px.h2, { color: C.yellow })}>{item.points}</Text>
        <Text style={sx(px.label, { color: C.greyDark, fontSize: 5 })}>PTS</Text>
      </View>
    </View>
  );
}

function ConstructorRow({ item, C, px, styles }: { item: { pos: number; name: string; teamColor: string; points: number; wins: number }; C: any; px: any; styles: any }) {
  const logo = teamLogoSource(item.name);
  return (
    <View style={styles.row}>
      <View style={sx(styles.posBox, { borderColor: item.pos <= 3 ? PODIUM_COLORS[item.pos - 1] : C.border })}>
        <Text style={sx(px.h3, { color: item.pos <= 3 ? PODIUM_COLORS[item.pos - 1] : C.grey })}>
          {String(item.pos).padStart(2, "0")}
        </Text>
      </View>
      {logo ? <Image source={logo} style={styles.logo} resizeMode="contain" /> : <View style={sx(styles.stripe, { backgroundColor: item.teamColor })} />}
      <View style={styles.nameCol}>
        <Text style={sx(px.h3, { color: item.teamColor || C.white })}>{item.name.toUpperCase()}</Text>
      </View>
      <View style={styles.ptsBox}>
        <Text style={sx(px.h2, { color: C.yellow })}>{item.points}</Text>
        <Text style={sx(px.label, { color: C.greyDark, fontSize: 5 })}>PTS</Text>
      </View>
    </View>
  );
}

export default function StandingsScreen() {
  const { C, px, scaleValue } = useThemeTokens();
  const styles = useMemo(() => createStyles(C, scaleValue), [C, scaleValue]);
  const [tab, setTab] = useState<Tab>("drivers");
  const driverQuery = useDriverStandings();
  const constructorQuery = useConstructorStandings();

  const driverStandings = driverQuery.data ?? [];
  const constructorStandings = constructorQuery.data ?? [];
  const leader = tab === "drivers" ? driverStandings[0] : constructorStandings[0];
  const isLoading = tab === "drivers" ? driverQuery.isLoading : constructorQuery.isLoading;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar backgroundColor={C.bg} />

      <View style={styles.header}>
        <Text style={px.h1}>STANDINGS</Text>
        <Text style={sx(px.label, { color: C.accent })}>{new Date().getFullYear()} SEASON</Text>
      </View>

      <View style={styles.tabRow}>
        {(["drivers", "constructors"] as Tab[]).map((t) => (
          <TouchableOpacity key={t} style={sx(styles.tabBtn, tab === t && styles.tabBtnActive)} onClick={() => setTab(t)}>
            <Text style={sx(px.label, { color: tab === t ? C.bg : C.grey })}>
              {t === "drivers" ? "DRIVERS" : "CONSTRUCTORS"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {leader && (
        <View style={sx(styles.leaderBanner, { borderColor: leader.teamColor })}>
          <View style={sx(styles.leaderStripe, { backgroundColor: leader.teamColor })} />
          <View style={styles.leaderLeft}>
            <Text style={sx(px.label, { color: C.grey })}>CHAMPIONSHIP LEADER</Text>
            <Text style={sx(px.h1, { color: leader.teamColor, marginTop: 4 })}>{leader.name}</Text>
          </View>
          <Text style={sx(px.h1, { color: C.yellow, fontSize: 20 })}>{leader.points}</Text>
        </View>
      )}

      <View style={styles.colHeader}>
        <Text style={sx(px.label, { width: 40, fontSize: 6 })}>POS</Text>
        <Text style={sx(px.label, { flex: 1, fontSize: 6 })}>{tab === "drivers" ? "DRIVER" : "TEAM"}</Text>
        <Text style={sx(px.label, { width: 56, textAlign: "right", fontSize: 6 })}>PTS</Text>
      </View>

      {isLoading && (
        <View style={{ padding: 24, alignItems: "center" }}>
          <Text style={sx(px.label, { color: C.greyDark })}>LOADING SEASON DATA...</Text>
        </View>
      )}

      {tab === "drivers" ? (
        <FlatList
          data={driverStandings}
          keyExtractor={(d) => String(d.pos)}
          renderItem={({ item }) => <DriverRow item={item} C={C} px={px} styles={styles} />}
          contentContainerStyle={{ paddingBottom: 16 }}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      ) : (
        <FlatList
          data={constructorStandings}
          keyExtractor={(d) => String(d.pos)}
          renderItem={({ item }) => <ConstructorRow item={item} C={C} px={px} styles={styles} />}
          contentContainerStyle={{ paddingBottom: 16 }}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
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
      padding: m(16), paddingBottom: m(12), borderBottomWidth: 2, borderBottomColor: C.accent,
    } as CSSProperties,
    tabRow: { flexDirection: "row", margin: m(12), borderWidth: 2, borderColor: C.borderBright } as CSSProperties,
    tabBtn: { flex: 1, paddingTop: m(10), paddingBottom: m(10), alignItems: "center", minHeight: m(42) } as CSSProperties,
    tabBtnActive: { backgroundColor: C.accent } as CSSProperties,

    leaderBanner: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      marginLeft: m(12), marginRight: m(12), marginBottom: m(8),
      borderWidth: 2, backgroundColor: C.bgCard, padding: m(12), position: "relative",
    } as CSSProperties,
    leaderStripe: { width: 4, height: "100%", position: "absolute", left: 0, top: 0 } as CSSProperties,
    leaderLeft: { flex: 1, paddingLeft: m(10) } as CSSProperties,

    colHeader: {
      flexDirection: "row", alignItems: "center",
      paddingLeft: m(12), paddingRight: m(12), paddingTop: m(6), paddingBottom: m(6),
      borderBottomWidth: 1, borderBottomColor: C.borderBright, backgroundColor: C.bgPanel,
    } as CSSProperties,
    sep: { height: 1, backgroundColor: C.border } as CSSProperties,

    row: { flexDirection: "row", alignItems: "center", paddingLeft: m(12), paddingRight: m(12), paddingTop: m(12), paddingBottom: m(12), minHeight: m(56), backgroundColor: C.bg } as CSSProperties,
    posBox: { width: m(32), height: m(32), borderWidth: 1, alignItems: "center", justifyContent: "center", marginRight: m(6) } as CSSProperties,
    stripe: { width: 3, height: m(36), marginRight: m(10) } as CSSProperties,
    logo: { width: m(28), height: m(28), marginRight: m(10) } as CSSProperties,
    nameCol: { flex: 1 } as CSSProperties,
    ptsBox: { width: m(56), alignItems: "flex-end" } as CSSProperties,
  });
}
