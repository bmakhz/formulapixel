import { useMemo, type CSSProperties } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar, SafeAreaView } from "../components/primitives";
import { useThemeTokens } from "../theme";
import { useSettingsStore } from "../store/useSettingsStore";
import { sx } from "../utils/sx";

// Ported from f1-live/app/(tabs)/settings.tsx

function PixelSwitch({
  value, onValueChange, C, px, styles,
}: { value: boolean; onValueChange: (v: boolean) => void; C: any; px: any; styles: any }) {
  return (
    <TouchableOpacity
      style={sx(styles.pSwitch, { borderColor: value ? C.accent : C.border })}
      onClick={() => onValueChange(!value)}
      activeOpacity={0.8}
    >
      <View style={sx(styles.pSwitchKnob, { left: value ? 18 : 2, backgroundColor: value ? C.accent : C.greyDark })} />
      <Text style={sx(px.label, { color: value ? C.accent : C.greyDark, fontSize: 5, paddingLeft: value ? 2 : 16 })}>
        {value ? "ON" : "OFF"}
      </Text>
    </TouchableOpacity>
  );
}

function SectionHeader({ title, C, px, styles }: { title: string; C: any; px: any; styles: any }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={sx(px.label, { color: C.accent })}>// {title}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

function SettingRow({
  label, sub, value, onToggle, C, px, styles,
}: { label: string; sub?: string; value: boolean; onToggle: (v: boolean) => void; C: any; px: any; styles: any }) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <Text style={sx(px.h3, { color: C.white })}>{label}</Text>
        {sub && <Text style={sx(px.label, { color: C.greyDark, marginTop: 3, fontSize: 5 })}>{sub}</Text>}
      </View>
      <PixelSwitch value={value} onValueChange={onToggle} C={C} px={px} styles={styles} />
    </View>
  );
}

function SelectRow({
  label, value, onPress, C, px, styles,
}: { label: string; value: string; onPress: () => void; C: any; px: any; styles: any }) {
  return (
    <TouchableOpacity style={styles.settingRow} onClick={onPress} activeOpacity={0.8}>
      <View style={styles.settingLeft}>
        <Text style={sx(px.h3, { color: C.white })}>{label}</Text>
      </View>
      <View style={sx(styles.selector, { borderColor: C.borderBright, backgroundColor: C.bgPanel })}>
        <Text style={sx(px.label, { color: C.accent })}>{value}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { C, px } = useThemeTokens();
  const styles = useMemo(() => createStyles(C), [C]);
  const mode = useSettingsStore((s) => s.mode);
  const scale = useSettingsStore((s) => s.scale);
  const speedUnit = useSettingsStore((s) => s.speedUnit);
  const temperatureUnit = useSettingsStore((s) => s.temperatureUnit);
  const setMode = useSettingsStore((s) => s.setMode);
  const setScale = useSettingsStore((s) => s.setScale);
  const setSpeedUnit = useSettingsStore((s) => s.setSpeedUnit);
  const setTemperatureUnit = useSettingsStore((s) => s.setTemperatureUnit);

  const nextScale = () => {
    if (scale === "small") return setScale("medium");
    if (scale === "medium") return setScale("large");
    return setScale("small");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar backgroundColor={C.bg} />

      <View style={styles.header}>
        <Text style={px.h1}>SETTINGS</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll}>
        <SectionHeader title="DISPLAY" C={C} px={px} styles={styles} />
        <View style={styles.card}>
          <SettingRow
            label="DARK MODE"
            sub="TOGGLE LIGHT / DARK UI"
            value={mode === "dark"}
            onToggle={(v) => setMode(v ? "dark" : "light")}
            C={C} px={px} styles={styles}
          />
          <View style={styles.cardSep} />
          <SelectRow label="SCALE" value={scale.toUpperCase()} onPress={nextScale} C={C} px={px} styles={styles} />
          <View style={styles.cardSep} />
          <SelectRow
            label="SPEED"
            value={speedUnit === "kmh" ? "KM/H" : "MPH"}
            onPress={() => setSpeedUnit(speedUnit === "kmh" ? "mph" : "kmh")}
            C={C} px={px} styles={styles}
          />
          <View style={styles.cardSep} />
          <SelectRow
            label="TEMPERATURE"
            value={temperatureUnit}
            onPress={() => setTemperatureUnit(temperatureUnit === "C" ? "F" : "C")}
            C={C} px={px} styles={styles}
          />
        </View>

        <View style={{ marginTop: 24, padding: 8, alignItems: "center" }}>
          <Text style={sx(px.label, { color: C.greyDark, fontSize: 5, lineHeight: "10px", textAlign: "center" })}>
            UNOFFICIAL. NOT ASSOCIATED WITH FORMULA 1.
            <br />
            DATA PROVIDED BY OPENF1 API &amp; JOLPICA.
          </Text>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(C: any) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg, minHeight: 0 } as CSSProperties,
    header: { padding: 16, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: C.accent } as CSSProperties,
    scroll: { padding: 12 } as CSSProperties,

    sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16, marginBottom: 8 } as CSSProperties,
    sectionLine: { flex: 1, height: 1, backgroundColor: C.border } as CSSProperties,

    card: { borderWidth: 2, borderColor: C.border, backgroundColor: C.bgCard } as CSSProperties,
    cardSep: { height: 1, backgroundColor: C.border } as CSSProperties,

    settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, gap: 12 } as CSSProperties,
    settingLeft: { flex: 1 } as CSSProperties,

    selector: { minWidth: 78, borderWidth: 2, paddingLeft: 8, paddingRight: 8, paddingTop: 6, paddingBottom: 6, alignItems: "center" } as CSSProperties,

    pSwitch: { width: 40, height: 20, borderWidth: 2, backgroundColor: C.bgPanel, position: "relative", justifyContent: "center" } as CSSProperties,
    pSwitchKnob: { position: "absolute", width: 12, height: 12, top: 2 } as CSSProperties,
  });
}
