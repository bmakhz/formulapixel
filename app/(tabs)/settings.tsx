import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { C, px } from "../../components/theme";

// ── Pixel switch ─────────────────────────────────────────────────
function PixelSwitch({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) {
  return (
    <TouchableOpacity
      style={[styles.pSwitch, { borderColor: value ? C.accent : C.border }]}
      onPress={() => onValueChange(!value)}
      activeOpacity={0.8}
    >
      <View style={[styles.pSwitchKnob, { left: value ? 18 : 2, backgroundColor: value ? C.accent : C.greyDark }]} />
      <Text style={[px.label, { color: value ? C.accent : C.greyDark, fontSize: 5, paddingLeft: value ? 2 : 16 }]}>
        {value ? "ON" : "OFF"}
      </Text>
    </TouchableOpacity>
  );
}

// ── Section header ───────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[px.label, { color: C.accent }]}>// {title}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

// ── Setting row ──────────────────────────────────────────────────
function SettingRow({
  label, sub, value, onToggle,
}: {
  label: string;
  sub?: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <Text style={[px.h3, { color: C.white }]}>{label}</Text>
        {sub && <Text style={[px.label, { color: C.greyDark, marginTop: 3, fontSize: 5 }]}>{sub}</Text>}
      </View>
      <PixelSwitch value={value} onValueChange={onToggle} />
    </View>
  );
}

export default function SettingsScreen() {
  const [darkMode,        setDarkMode]        = useState(true);
  const [showInterval,    setShowInterval]    = useState(false);
  const [showDNF,         setShowDNF]         = useState(true);
  const [showMiniSectors, setShowMiniSectors] = useState(true);
  const [showWeather,     setShowWeather]     = useState(true);
  const [notifications,   setNotifications]   = useState(true);
  const [sessionAlerts,   setSessionAlerts]   = useState(true);
  const [scAlerts,        setScAlerts]        = useState(false);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[px.h1]}>SETTINGS</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Display ── */}
        <SectionHeader title="DISPLAY" />
        <View style={styles.card}>
          <SettingRow
            label="DARK MODE"
            sub="ALWAYS ON BY DEFAULT"
            value={darkMode}
            onToggle={setDarkMode}
          />
          <View style={styles.cardSep} />
          <SettingRow
            label="SHOW INTERVAL"
            sub="GAP TO CAR AHEAD VS LEADER"
            value={showInterval}
            onToggle={setShowInterval}
          />
          <View style={styles.cardSep} />
          <SettingRow
            label="SHOW WEATHER BAR"
            sub="AIR / TRACK TEMPS IN LIVE VIEW"
            value={showWeather}
            onToggle={setShowWeather}
          />
          <View style={styles.cardSep} />
          <SettingRow
            label="MINI SECTORS"
            sub="COLOUR-CODED SECTOR STRIP"
            value={showMiniSectors}
            onToggle={setShowMiniSectors}
          />
          <View style={styles.cardSep} />
          <SettingRow
            label="SHOW DNF DRIVERS"
            sub="LIST RETIRED DRIVERS AT BOTTOM"
            value={showDNF}
            onToggle={setShowDNF}
          />
        </View>

        {/* ── Notifications ── */}
        <SectionHeader title="NOTIFICATIONS" />
        <View style={styles.card}>
          <SettingRow
            label="PUSH NOTIFICATIONS"
            sub="ALLOW APP TO SEND ALERTS"
            value={notifications}
            onToggle={setNotifications}
          />
          <View style={styles.cardSep} />
          <SettingRow
            label="SESSION START"
            sub="FP / QUALIFYING / RACE ALERTS"
            value={sessionAlerts}
            onToggle={setSessionAlerts}
          />
          <View style={styles.cardSep} />
          <SettingRow
            label="SAFETY CAR"
            sub="ALERT WHEN SC / VSC DEPLOYED"
            value={scAlerts}
            onToggle={setScAlerts}
          />
        </View>

        {/* Disclaimer */}
        <View style={{ marginTop: 24, padding: 8, alignItems: "center" }}>
          <Text style={[px.label, { color: "#2a2a2a", fontSize: 5, lineHeight: 10, textAlign: "center" }]}>
            UNOFFICIAL. NOT ASSOCIATED WITH FORMULA 1.{"\n"}
            DATA PROVIDED BY OPENF1 API & JOLPICA.
          </Text>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: {
    padding: 16, paddingBottom: 12,
    borderBottomWidth: 2, borderBottomColor: C.accent,
  },
  scroll: { padding: 12 },

  sectionHeader: {
    flexDirection: "row", alignItems: "center",
    gap: 8, marginTop: 16, marginBottom: 8,
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: C.border },

  card: {
    borderWidth: 2, borderColor: C.border,
    backgroundColor: C.bgCard,
  },
  cardSep: { height: 1, backgroundColor: C.border },

  settingRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    padding: 14, gap: 12,
  },
  settingLeft: { flex: 1 },

  pSwitch: {
    width: 40, height: 20,
    borderWidth: 2, borderRadius: 0,
    backgroundColor: C.bgPanel,
    position: "relative", justifyContent: "center",
  },
  pSwitchKnob: {
    position: "absolute",
    width: 12, height: 12,
    top: 2,
  },
});
