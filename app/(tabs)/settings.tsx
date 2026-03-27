import React from "react";
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemeTokens } from "../../components/theme";
import { useSettingsStore } from "../../store/useSettingsStore";

// ── Pixel switch ─────────────────────────────────────────────────
function PixelSwitch({
  value,
  onValueChange,
  C,
  px,
  styles,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
  C: any;
  px: any;
  styles: any;
}) {
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
function SectionHeader({ title, C, px, styles }: { title: string; C: any; px: any; styles: any }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[px.label, { color: C.accent }]}>// {title}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

// ── Setting row ──────────────────────────────────────────────────
function SettingRow({
  label, sub, value, onToggle, C, px, styles,
}: {
  label: string;
  sub?: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  C: any;
  px: any;
  styles: any;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <Text style={[px.h3, { color: C.white }]}>{label}</Text>
        {sub && <Text style={[px.label, { color: C.greyDark, marginTop: 3, fontSize: 5 }]}>{sub}</Text>}
      </View>
      <PixelSwitch value={value} onValueChange={onToggle} C={C} px={px} styles={styles} />
    </View>
  );
}

function SelectRow({
  label,
  value,
  onPress,
  C,
  px,
  styles,
}: {
  label: string;
  value: string;
  onPress: () => void;
  C: any;
  px: any;
  styles: any;
}) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.settingLeft}>
        <Text style={[px.h3, { color: C.white }]}>{label}</Text>
      </View>
      <View style={[styles.selector, { borderColor: C.borderBright, backgroundColor: C.bgPanel }]}>
        <Text style={[px.label, { color: C.accent }]}>{value}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { C, px, statusBarStyle } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(C), [C]);
  const mode = useSettingsStore((s) => s.mode);
  const scale = useSettingsStore((s) => s.scale);
  const speedUnit = useSettingsStore((s) => s.speedUnit);
  const temperatureUnit = useSettingsStore((s) => s.temperatureUnit);
  const setMode = useSettingsStore((s) => s.setMode);
  const setScale = useSettingsStore((s) => s.setScale);
  const setSpeedUnit = useSettingsStore((s) => s.setSpeedUnit);
  const setTemperatureUnit = useSettingsStore((s) => s.setTemperatureUnit);

  const nextScale = () => {
    if (scale === "small") return setScale("normal");
    if (scale === "normal") return setScale("large");
    return setScale("small");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={C.bg} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[px.h1]}>SETTINGS</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Display ── */}
        <SectionHeader title="DISPLAY" C={C} px={px} styles={styles} />
        <View style={styles.card}>
          <SettingRow
            label="DARK MODE"
            sub="TOGGLE LIGHT / DARK UI"
            value={mode === "dark"}
            onToggle={(v) => setMode(v ? "dark" : "light")}
            C={C}
            px={px}
            styles={styles}
          />
          <View style={styles.cardSep} />
          <SelectRow
            label="SCALE"
            value={scale.toUpperCase()}
            onPress={nextScale}
            C={C}
            px={px}
            styles={styles}
          />
          <View style={styles.cardSep} />
          <SelectRow
            label="SPEED"
            value={speedUnit === "kmh" ? "KM/H" : "MPH"}
            onPress={() => setSpeedUnit(speedUnit === "kmh" ? "mph" : "kmh")}
            C={C}
            px={px}
            styles={styles}
          />
          <View style={styles.cardSep} />
          <SelectRow
            label="TEMPERATURE"
            value={temperatureUnit}
            onPress={() => setTemperatureUnit(temperatureUnit === "C" ? "F" : "C")}
            C={C}
            px={px}
            styles={styles}
          />
        </View>

        {/* Disclaimer */}
        <View style={{ marginTop: 24, padding: 8, alignItems: "center" }}>
          <Text style={[px.label, { color: C.greyDark, fontSize: 5, lineHeight: 10, textAlign: "center" }]}>
            UNOFFICIAL. NOT ASSOCIATED WITH FORMULA 1.{"\n"}
            DATA PROVIDED BY OPENF1 API & JOLPICA.
          </Text>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(C: any) {
  return StyleSheet.create({
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

  selector: {
    minWidth: 78,
    borderWidth: 2,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: "center",
  },

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
}
