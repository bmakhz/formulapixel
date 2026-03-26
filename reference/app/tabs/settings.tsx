import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Switch, StatusBar, TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { C, px } from "../../components/theme";

function PixelSwitch({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.pSwitch, { borderColor: value ? C.accent : C.border }]}
      onPress={() => onValueChange(!value)}
    >
      <View style={[styles.pSwitchKnob, { left: value ? 18 : 2, backgroundColor: value ? C.accent : C.greyDark }]} />
      <Text style={[px.label, { color: value ? C.accent : C.greyDark, fontSize: 5, paddingHorizontal: 2 }]}>
        {value ? "ON " : "OFF"}
      </Text>
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[px.label, { color: C.accent }]}>// {title}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

function SettingRow({
  label,
  sub,
  value,
  onToggle,
  rightText,
  onPress,
  danger,
}: {
  label: string;
  sub?: string;
  value?: boolean;
  onToggle?: (v: boolean) => void;
  rightText?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={!onPress && onToggle === undefined}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <Text style={[px.h3, { color: danger ? C.accent : C.white }]}>{label}</Text>
        {sub && <Text style={[px.label, { color: C.greyDark, marginTop: 3, fontSize: 5 }]}>{sub}</Text>}
      </View>
      {onToggle !== undefined && (
        <PixelSwitch value={value ?? false} onValueChange={onToggle} />
      )}
      {rightText && (
        <Text style={[px.label, { color: C.yellow, fontSize: 6 }]}>{rightText}</Text>
      )}
      {onPress && !rightText && (
        <Text style={[px.label, { color: C.grey }]}>►</Text>
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const [notifications, setNotifications]     = useState(true);
  const [sessionAlerts, setSessionAlerts]     = useState(true);
  const [scAlerts, setScAlerts]               = useState(false);
  const [posAlerts, setPosAlerts]             = useState(false);
  const [showInterval, setShowInterval]       = useState(false);
  const [showDNF, setShowDNF]                 = useState(true);
  const [showMiniSectors, setShowMiniSectors] = useState(true);
  const [showSectors, setShowSectors]         = useState(true);
  const [autoScroll, setAutoScroll]           = useState(false);
  const [backendUrl, setBackendUrl]           = useState("ws://your-server.com:8080");

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[px.h1]}>SETTINGS</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Data Source ── */}
        <SectionHeader title="DATA SOURCE" />

        {/* Backend URL input */}
        <View style={styles.inputGroup}>
          <Text style={[px.label, { color: C.grey, marginBottom: 6 }]}>SIGNALR BACKEND URL</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={backendUrl}
              onChangeText={setBackendUrl}
              placeholderTextColor={C.greyDark}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <Text style={[px.label, { color: C.greyDark, marginTop: 4, fontSize: 5 }]}>
            USED DURING LIVE SESSIONS. SEE README.
          </Text>
        </View>

        <View style={styles.card}>
          <SettingRow
            label="OPENF1 API"
            sub="HISTORICAL & SESSION DATA (ALWAYS ON)"
            rightText="ACTIVE"
          />
          <View style={styles.cardSep} />
          <SettingRow
            label="REFRESH RATE"
            sub="HOW OFTEN TO POLL DURING SESSIONS"
            onPress={() => {}}
            rightText="3S"
          />
          <View style={styles.cardSep} />
          <SettingRow
            label="CONNECT BACKEND"
            sub="TAP TO TEST YOUR SIGNALR CONNECTION"
            onPress={() => {}}
          />
        </View>

        {/* ── Display ── */}
        <SectionHeader title="DISPLAY" />
        <View style={styles.card}>
          <SettingRow
            label="SHOW INTERVAL"
            sub="GAP TO CAR AHEAD VS GAP TO LEADER"
            value={showInterval}
            onToggle={setShowInterval}
          />
          <View style={styles.cardSep} />
          <SettingRow
            label="MINI SECTORS"
            sub="SHOW MINI SECTOR STRIP PER DRIVER"
            value={showMiniSectors}
            onToggle={setShowMiniSectors}
          />
          <View style={styles.cardSep} />
          <SettingRow
            label="SECTOR TIMES"
            sub="SHOW S1 / S2 / S3 TIMES"
            value={showSectors}
            onToggle={setShowSectors}
          />
          <View style={styles.cardSep} />
          <SettingRow
            label="SHOW DNF DRIVERS"
            sub="SHOW RETIRED DRIVERS AT BOTTOM"
            value={showDNF}
            onToggle={setShowDNF}
          />
          <View style={styles.cardSep} />
          <SettingRow
            label="AUTO SCROLL"
            sub="FOLLOW YOUR FAVOURITE DRIVER"
            value={autoScroll}
            onToggle={setAutoScroll}
          />
        </View>

        {/* ── Notifications ── */}
        <SectionHeader title="NOTIFICATIONS" />
        <View style={styles.card}>
          <SettingRow
            label="PUSH NOTIFICATIONS"
            value={notifications}
            onToggle={setNotifications}
          />
          <View style={styles.cardSep} />
          <SettingRow
            label="SESSION START"
            sub="FP / QUALIFYING / RACE"
            value={sessionAlerts}
            onToggle={setSessionAlerts}
          />
          <View style={styles.cardSep} />
          <SettingRow
            label="SAFETY CAR"
            sub="ALERT WHEN SC/VSC DEPLOYED"
            value={scAlerts}
            onToggle={setScAlerts}
          />
          <View style={styles.cardSep} />
          <SettingRow
            label="POSITION CHANGE"
            sub="ALERT ON POSITION CHANGES (TOP 3)"
            value={posAlerts}
            onToggle={setPosAlerts}
          />
        </View>

        {/* ── Info box ── */}
        <View style={styles.infoBox}>
          <Text style={[px.label, { color: C.accent, marginBottom: 6 }]}>► LIVE DATA SETUP</Text>
          <Text style={[px.label, { color: C.grey, fontSize: 5, lineHeight: 10 }]}>
            FOR REAL-TIME DATA DURING RACE SESSIONS,{"\n"}
            DEPLOY A NODE.JS BACKEND THAT CONNECTS TO{"\n"}
            F1'S SIGNALR STREAM AND ENTER THE URL ABOVE.{"\n"}
            SEE README.MD FOR FULL SETUP INSTRUCTIONS.
          </Text>
        </View>

        {/* ── About ── */}
        <SectionHeader title="ABOUT" />
        <View style={styles.card}>
          <SettingRow label="VERSION"    rightText="1.0.0" />
          <View style={styles.cardSep} />
          <SettingRow label="TERMS"      onPress={() => {}} />
          <View style={styles.cardSep} />
          <SettingRow label="PRIVACY"    onPress={() => {}} />
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={[px.label, { color: "#2a2a2a", fontSize: 5, lineHeight: 10, textAlign: "center" }]}>
            UNOFFICIAL. NOT ASSOCIATED WITH FORMULA 1.{"\n"}
            F1, FORMULA ONE ARE MARKS OF FORMULA ONE LICENSING B.V.
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
    padding: 12, gap: 12,
  },
  settingLeft: { flex: 1 },

  pSwitch: {
    width: 38, height: 18,
    borderWidth: 2, borderRadius: 0,
    backgroundColor: C.bgPanel,
    position: "relative", justifyContent: "center",
  },
  pSwitchKnob: {
    position: "absolute",
    width: 12, height: 12,
    top: 1,
  },

  inputGroup: {
    marginBottom: 8,
    borderWidth: 2, borderColor: C.border,
    backgroundColor: C.bgCard,
    padding: 12,
  },
  inputWrap: {
    borderWidth: 2, borderColor: C.borderBright,
    backgroundColor: C.bg,
  },
  input: {
    fontFamily: "PressStart2P",
    fontSize: 7,
    color: C.cyan,
    padding: 10,
    lineHeight: 14,
  },

  infoBox: {
    marginTop: 8,
    borderWidth: 2, borderColor: C.accentDim,
    backgroundColor: "#120005",
    padding: 12,
  },

  disclaimer: { marginTop: 16, padding: 8, alignItems: "center" },
});
