import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, StatusBar, Image, ScrollView, SafeAreaView,
} from "../components/primitives";
import { useActiveRaceSession, useLiveRaceData, formatLapTime, getRaceStatus } from "../hooks/useOpenF1";
import { useF1LiveTiming, type RaceControlItem } from "../hooks/useF1LiveTiming";
import { useThemeTokens } from "../theme";
import { useSettingsStore } from "../store/useSettingsStore";
import { formatSpeed, formatTemperature } from "../utils/unitConversion";
import { teamLiverySource, trackOutlineSource } from "../utils/imageMaps";
import { sx } from "../utils/sx";
import { useIsDesktop } from "../hooks/useBreakpoint";

// Ported from f1-live/app/(tabs)/live.tsx

type ViewMode = "gap" | "interval";

// ── Pulsing live dot ── (was RN Animated.loop; now a CSS keyframe, see index.css)
function BlinkDot({ color }: { color: string }) {
  return <div className="blink-dot" style={{ width: 6, height: 6, backgroundColor: color }} />;
}

const TYRE_COLORS: Record<string, string> = {
  SOFT: "#FF3333", MEDIUM: "#FFE600", HARD: "#DDDDDD",
  INTERMEDIATE: "#39B54A", WET: "#0067FF",
  S: "#FF3333", M: "#FFE600", H: "#DDDDDD",
  I: "#39B54A", W: "#0067FF",
};

function TireBadge({ compound, age, C, styles }: { compound: string; age: number; C: any; styles: any }) {
  const short = compound?.charAt(0) ?? "-";
  const color = TYRE_COLORS[compound?.toUpperCase()] ?? TYRE_COLORS[short] ?? C.white;
  return (
    <View style={sx(styles.tireBadge, { borderColor: color, backgroundColor: C.bgCard })}>
      <Text style={sx(styles.tireCompound, { color })}>{short}</Text>
      <Text style={styles.tireAge}>{age}</Text>
    </View>
  );
}

function SectorCell({ value, styles }: { value: number | null; styles: any }) {
  const text = value != null && value > 0 ? value.toFixed(2) : "--.-";
  return <Text style={styles.sectorText}>{text}</Text>;
}

type DriverItem = ReturnType<typeof useLiveRaceData>["rows"][number];

function DriverRow({ driver, mode, quali, C, px, styles }: { driver: DriverItem; mode: ViewMode; quali?: boolean; C: any; px: any; styles: any }) {
  const gapText = mode === "gap" ? driver.gap : driver.gapToNext;
  const knockedOut = driver.knockedOut === true;
  const cutoff = driver.cutoff === true && !knockedOut;
  const nonRunning = driver.status !== "RUN";
  const rowBg = cutoff ? C.accentDim : nonRunning || knockedOut ? C.bgPanel : C.bg;
  const rowOpacity = knockedOut ? 0.4 : nonRunning ? 0.65 : 1;
  const livery = teamLiverySource(driver.team);

  return (
    <View style={sx(styles.driverRow, { backgroundColor: rowBg, opacity: rowOpacity })}>
      <View style={sx(styles.teamStripe, { backgroundColor: driver.teamColor })} />

      <View style={styles.posWrap}>
        <Text style={sx(px.h3, { color: driver.status !== "RUN" ? C.greyDark : C.white })}>
          {driver.status !== "RUN" ? "--" : String(driver.position).padStart(2, " ")}
        </Text>
      </View>

      <View style={styles.liveryWrap}>
        {livery && <Image source={livery} style={styles.livery} resizeMode="contain" />}
      </View>

      <View style={styles.driverCol}>
        <Text style={sx(px.h2, { color: driver.teamColor || C.white })}>{driver.short}</Text>
        <Text style={sx(px.label, { color: C.greyDark, marginTop: 2, fontSize: 5 })} numberOfLines={1}>
          {driver.team.toUpperCase().slice(0, 10)}
        </Text>
      </View>

      <View style={styles.gapCol}>
        <Text style={sx(px.label, { color: knockedOut || nonRunning || gapText === "LEADER" ? C.accent : C.white, fontSize: 6 })} numberOfLines={1}>
          {knockedOut ? "OUT" : nonRunning ? driver.status : gapText === "LEADER" ? "LDR" : gapText}
        </Text>
      </View>

      <TireBadge compound={driver.compound} age={driver.tireAge} C={C} styles={styles} />

      <View style={styles.pitsCol}>
        <Text style={sx(px.label, { color: C.grey })}>{driver.pits}</Text>
        <Text style={sx(px.label, { color: C.greyDark, fontSize: 5 })}>PIT</Text>
      </View>

      {quali ? (
        <View style={styles.sectorsCol}>
          <Text style={sx(px.mono, { fontSize: 7, color: C.white, textAlign: "center" })} numberOfLines={1}>
            {formatLapTime(driver.bestLapTime)}
          </Text>
        </View>
      ) : (
        <View style={styles.sectorsCol}>
          <View style={styles.sectorWrapper}><SectorCell value={driver.sectorTimes[0]} styles={styles} /></View>
          <View style={styles.sectorWrapper}><SectorCell value={driver.sectorTimes[1]} styles={styles} /></View>
          <View style={styles.sectorWrapper}><SectorCell value={driver.sectorTimes[2]} styles={styles} /></View>
        </View>
      )}

      {/* LAST, then BEST — swapped from the original BEST/LAST order */}
      <View style={styles.lapCol}>
        <Text style={styles.lapText}>{formatLapTime(driver.lapTime)}</Text>
      </View>

      <View style={styles.lapCol}>
        <Text style={styles.lapText}>{formatLapTime(driver.bestLapTime)}</Text>
      </View>
    </View>
  );
}

// ── Race control ────────────────────────────────────────────────
function rcColor(flag: string, category: string, C: any): string {
  const f = flag.toUpperCase();
  if (f.includes("RED")) return C.accent;
  if (f.includes("CHEQUERED")) return C.white;
  if (f.includes("BLACK AND WHITE")) return C.yellow;
  if (f.includes("YELLOW")) return C.yellow;
  if (f.includes("GREEN")) return C.green;
  if (f.includes("BLUE")) return C.cyan;
  const c = category.toUpperCase();
  if (c === "SAFETYCAR") return C.yellow;
  if (c === "DRS") return C.cyan;
  return C.greyDark;
}

function parseHMS(s?: string | null): number | null {
  if (!s) return null;
  const m = s.match(/(\d{1,2}):(\d{2}):(\d{2})/);
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : null;
}

function formatCountdown(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${p(m)}:${p(sec)}` : `${p(m)}:${p(sec)}`;
}

function liveCountdown(sess: { clock: string | null; clockUtc: string | null; extrapolating: boolean } | null, nowMs: number): string | null {
  const base = parseHMS(sess?.clock);
  if (base == null) return null;
  if (!sess?.extrapolating || !sess?.clockUtc) return formatCountdown(base);
  const anchor = Date.parse(/[Zz]$|[+\-]\d{2}:?\d{2}$/.test(sess.clockUtc) ? sess.clockUtc : sess.clockUtc + "Z");
  if (Number.isNaN(anchor)) return formatCountdown(base);
  return formatCountdown(base - (nowMs - anchor) / 1000);
}

function offsetMs(gmt?: string | null): number {
  if (!gmt) return 0;
  const m = gmt.match(/(-?)(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return 0;
  const sign = m[1] === "-" ? -1 : 1;
  return sign * (Number(m[2]) * 3600 + Number(m[3]) * 60 + Number(m[4] || 0)) * 1000;
}

function trackHHMMSS(ms: number, offMs: number, withSeconds = true): string {
  const d = new Date(ms + offMs);
  const p = (n: number) => String(n).padStart(2, "0");
  const base = `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
  return withSeconds ? `${base}:${p(d.getUTCSeconds())}` : base;
}

function toTrackTime(utc: string, offMs: number): string {
  const ms = Date.parse(/[Zz]$|[+\-]\d{2}:?\d{2}$/.test(utc) ? utc : utc + "Z");
  if (Number.isNaN(ms)) {
    const m = utc.match(/T(\d{2}:\d{2})/);
    return m ? m[1] : "--:--";
  }
  return trackHHMMSS(ms, offMs, false);
}

function RaceControlPanel({ messages, offMs, trackTime, C, px, styles }: { messages: RaceControlItem[]; offMs: number; trackTime: string | null; C: any; px: any; styles: any }) {
  const [open, setOpen] = useState(false);
  if (!messages.length) return null;
  const latest = messages[0];
  const shown = open ? messages.slice(0, 30) : [];

  return (
    <View style={styles.rcWrap}>
      <TouchableOpacity activeOpacity={0.8} onClick={() => setOpen((o) => !o)} style={styles.rcHeader}>
        <View style={sx(styles.rcStripe, { backgroundColor: rcColor(latest.flag, latest.category, C) })} />
        <Text style={sx(px.label, { color: C.accent })}>RC</Text>
        {!open && (
          <Text style={sx(px.label, { color: C.white, flex: 1 })} numberOfLines={1}>
            {latest.message}
          </Text>
        )}
        {open && <Text style={sx(px.label, { color: C.grey, flex: 1 })}>RACE CONTROL</Text>}
        {trackTime && <Text style={sx(px.label, { color: C.cyan })}>{trackTime}</Text>}
        <Text style={sx(px.label, { color: C.grey })}>{messages.length}</Text>
        <Text style={sx(px.label, { color: C.accent })}>{open ? "[-]" : "[+]"}</Text>
      </TouchableOpacity>

      {open && (
        <ScrollView style={styles.rcList}>
          {shown.map((m, i) => (
            <View key={`${m.utc}-${i}`} style={styles.rcRow}>
              <View style={sx(styles.rcRowStripe, { backgroundColor: rcColor(m.flag, m.category, C) })} />
              <Text style={sx(px.label, { color: C.greyDark, width: 34 })}>{toTrackTime(m.utc, offMs)}</Text>
              {m.racingNumber && <Text style={sx(px.label, { color: C.cyan, width: 18 })}>#{m.racingNumber}</Text>}
              <Text style={sx(px.label, { color: C.white, flex: 1, lineHeight: "10px" })}>{m.message}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ── Main screen ─────────────────────────────────────────────────
export default function LiveScreen() {
  const { C, px, mode: themeMode, scaleValue } = useThemeTokens();
  const isDesktop = useIsDesktop();
  const styles = useMemo(() => createStyles(C, scaleValue, isDesktop), [C, scaleValue, isDesktop]);
  const [mode, setMode] = useState<ViewMode>("gap");
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const speedUnit = useSettingsStore((s) => s.speedUnit);
  const temperatureUnit = useSettingsStore((s) => s.temperatureUnit);
  const realtimeUrl = useSettingsStore((s) => s.realtimeUrl);
  const raceSessions = useActiveRaceSession();
  const activeSession = raceSessions.liveSession ?? raceSessions.activeRace;

  const sseData = useF1LiveTiming(realtimeUrl || null, !!realtimeUrl);
  const useSse = sseData.connected && sseData.rows.length > 0;

  const openF1Data = useLiveRaceData(useSse ? null : activeSession?.session_key ?? null);

  const liveData = useSse ? sseData : openF1Data;
  const sess = useSse ? sseData.session : null;

  const openF1Status = activeSession ? getRaceStatus(activeSession, Date.now()) : "upcoming";
  const isLive = useSse ? !!sess?.live : openF1Status === "live";

  const sessionName = sess?.name ?? activeSession?.session_type ?? activeSession?.session_name ?? "SESSION";
  const isQuali = /quali|shootout/i.test(sessionName);
  const segPrefix = /sprint/i.test(sessionName) ? "SQ" : "Q";
  const segment = useSse && isQuali && sess?.part ? `${segPrefix}${sess.part}` : null;
  const offMs = offsetMs(sess?.gmtOffset);
  const countdown = liveCountdown(sess, nowMs);
  const trackTime = sess ? trackHHMMSS(nowMs, offMs) : null;
  const cutoffAfter = useSse && isQuali && sess?.part && sess.part < 3 && sess.noEntries
    ? sess.noEntries[sess.part] ?? null
    : null;

  const totalLaps = useSse ? sseData.totalLaps : null;
  const raceControl = useSse ? sseData.raceControl : [];

  const raceName = useSse
    ? (sess?.country || sess?.meetingName || "GRAND PRIX")
    : (activeSession?.country_name ?? activeSession?.meeting_name ?? "GRAND PRIX");
  const isRaceOver = useSse
    ? (/race/i.test(sessionName) && !!sess?.finished)
    : (activeSession?.session_type === "Race" && openF1Status === "done");
  const sessionLabel = sessionName.toUpperCase();
  const airTemp = liveData.latestWeather?.air_temperature;
  const trkTemp = liveData.latestWeather?.track_temperature;
  const trackOutline = trackOutlineSource(
    themeMode,
    useSse ? sess?.country : activeSession?.country_name,
    useSse ? sess?.location : activeSession?.location,
    useSse ? sess?.circuit : activeSession?.circuit_short_name,
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar backgroundColor={C.bg} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.liveRow}>
            {isLive ? <BlinkDot color={C.accent} /> : <View style={{ width: 6, height: 6, backgroundColor: C.greyDark }} />}
            <Text style={sx(px.label, { color: isLive ? C.accent : C.grey })}>{isLive ? "LIVE" : isRaceOver ? "FINISHED" : "LATEST"}</Text>
            <Text style={sx(px.label, { color: C.cyan })}>{sessionLabel}</Text>
            {segment && <Text style={sx(px.label, { color: C.yellow })}>{segment}</Text>}
            {isLive && countdown && <Text style={sx(px.label, { color: C.grey })}>{countdown}</Text>}
            {isRaceOver && <Text style={sx(px.label, { color: C.yellow })}>🏁</Text>}
          </View>
          <View style={styles.titleRow}>
            {trackOutline && <Image source={trackOutline} style={styles.trackOutline} resizeMode="contain" />}
            <Text style={sx(px.h2, { color: C.white, flex: 1 })}>{raceName.toUpperCase().slice(0, 20)}</Text>
          </View>
        </View>
        {segment ? (
          <View style={styles.lapBox}>
            <Text style={sx(px.h1, { color: C.yellow })}>{segment}</Text>
            <Text style={sx(px.label, { color: C.grey, marginTop: 2 })}>{countdown ?? "--:--"}</Text>
          </View>
        ) : (
          <View style={styles.lapBox}>
            <Text style={sx(px.label, { color: C.grey })}>LAP</Text>
            <Text style={sx(px.h1, { color: C.yellow })}>{String(liveData.currentLap ?? "--").padStart(2, "0")}</Text>
            <Text style={sx(px.label, { color: C.grey })}>/{totalLaps != null ? String(totalLaps).padStart(2, "0") : "--"}</Text>
          </View>
        )}
      </View>

      <View style={styles.weatherStrip}>
        {[
          { label: "AIR", value: formatTemperature(airTemp, temperatureUnit) },
          { label: "TRK", value: formatTemperature(trkTemp, temperatureUnit) },
          { label: "HUM", value: liveData.latestWeather?.humidity != null ? `${Math.round(liveData.latestWeather.humidity)}%` : "--" },
          { label: "WND", value: formatSpeed(liveData.latestWeather?.wind_speed, speedUnit) },
          { label: "RAIN", value: liveData.latestWeather?.rainfall ? "YES" : "NO" },
        ].map((w) => (
          <View key={w.label} style={styles.weatherItem}>
            <Text style={sx(px.label, { color: C.greyDark, fontSize: 5 })}>{w.label}</Text>
            <Text style={sx(px.label, { color: C.cyan, fontSize: 6 })}>{w.value}</Text>
          </View>
        ))}
      </View>

      <RaceControlPanel messages={raceControl} offMs={offMs} trackTime={trackTime} C={C} px={px} styles={styles} />

      <ScrollableHeaders mode={mode} onToggle={() => setMode((m) => (m === "gap" ? "interval" : "gap"))} quali={isQuali && useSse} C={C} styles={styles} />

      {liveData.isLoading && liveData.rows.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={sx(px.label, { color: C.greyDark })}>LOADING...</Text>
        </View>
      ) : (
        <FlatList
          data={liveData.rows}
          keyExtractor={(d) => String(d.driverNumber)}
          renderItem={({ item, index }) => (
            <>
              <DriverRow driver={item} mode={mode} quali={isQuali && useSse} C={C} px={px} styles={styles} />
              {cutoffAfter != null && index === cutoffAfter - 1 && (
                <View style={styles.elimLine}>
                  <Text style={sx(px.label, { color: C.accent, fontSize: 6 })}>▼ ELIMINATION ▼</Text>
                </View>
              )}
            </>
          )}
          contentContainerStyle={{ paddingBottom: 12 }}
          ItemSeparatorComponent={() => <View style={styles.rowSep} />}
        />
      )}
    </SafeAreaView>
  );
}

function ScrollableHeaders({ mode, onToggle, quali, C, styles }: { mode: ViewMode; onToggle: () => void; quali?: boolean; C: any; styles: any }) {
  return (
    <View style={styles.colHeader}>
      <View style={styles.colStripeSpacer} />
      <Text style={sx(styles.colText, { width: 34, paddingLeft: 4 })}>POS</Text>
      <View style={styles.colLiverySpacer} />
      <Text style={sx(styles.colText, { flex: 1, minWidth: 70 })}>DRIVER</Text>
      <TouchableOpacity style={{ width: 62 }} onClick={onToggle}>
        <Text style={sx(styles.colText, { color: C.accent })}>{mode === "gap" ? "[GAP]" : "[INT]"}</Text>
      </TouchableOpacity>
      <Text style={sx(styles.colText, styles.colTyr)}>TYR</Text>
      <Text style={sx(styles.colText, { width: 30, textAlign: "center" })}>PIT</Text>
      <Text style={sx(styles.colText, { width: 80, paddingLeft: 2, textAlign: quali ? "center" : "left" })}>{quali ? "BEST LAP" : "S1·S2·S3"}</Text>
      {/* LAST, then BEST — matches the swapped row order below */}
      <Text style={sx(styles.colText, { width: 65, textAlign: "right" })}>LAST</Text>
      <Text style={sx(styles.colText, { width: 65, textAlign: "right" })}>BEST</Text>
    </View>
  );
}

function createStyles(C: any, scale: number, isDesktop: boolean) {
  const s = Math.max(0.9, Math.min(1.2, scale));
  const m = (n: number) => Math.round(n * s);
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg, minHeight: 0 } as CSSProperties,

    header: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
      padding: m(12), paddingBottom: m(8), borderBottomWidth: 2, borderBottomColor: C.accent,
    } as CSSProperties,
    headerLeft: { gap: m(4), flex: 1 } as CSSProperties,
    liveRow: { flexDirection: "row", alignItems: "center", gap: m(6) } as CSSProperties,
    titleRow: { flexDirection: "row", alignItems: "center", gap: m(8) } as CSSProperties,
    trackOutline: { width: m(44), height: m(24) } as CSSProperties,
    lapBox: { borderWidth: 2, borderColor: C.yellow, padding: m(8), alignItems: "center", backgroundColor: C.bgCard } as CSSProperties,

    weatherStrip: {
      flexDirection: "row", justifyContent: "space-around",
      paddingTop: m(6), paddingBottom: m(6), paddingLeft: m(8), paddingRight: m(8),
      backgroundColor: C.bgPanel, borderBottomWidth: 1, borderBottomColor: C.border,
    } as CSSProperties,
    weatherItem: { alignItems: "center", gap: m(2) } as CSSProperties,

    rcWrap: { backgroundColor: C.bgPanel, borderBottomWidth: 1, borderBottomColor: C.border } as CSSProperties,
    rcHeader: { flexDirection: "row", alignItems: "center", gap: m(6), paddingLeft: m(9), paddingRight: m(9), paddingTop: m(6), paddingBottom: m(6) } as CSSProperties,
    rcStripe: { width: 3, height: m(12) } as CSSProperties,
    rcList: { maxHeight: m(150) } as CSSProperties,
    rcRow: { flexDirection: "row", alignItems: "center", gap: m(6), paddingLeft: m(9), paddingRight: m(9), paddingTop: m(4), paddingBottom: m(4), borderTopWidth: 1, borderTopColor: C.border } as CSSProperties,
    rcRowStripe: { width: 3, height: m(16) } as CSSProperties,

    colHeader: {
      flexDirection: "row", alignItems: "center",
      paddingLeft: 0, paddingRight: m(8), paddingTop: m(8), paddingBottom: m(8),
      borderBottomWidth: 1, borderBottomColor: C.borderBright, backgroundColor: C.bgPanel,
      // Desktop: spread columns across the full width instead of leaving slack.
      ...(isDesktop ? { justifyContent: "space-between" } : {}),
    } as CSSProperties,
    colText: { fontFamily: "PressStart2P", fontSize: 6, color: C.grey } as CSSProperties,
    colStripeSpacer: { width: 3, marginRight: m(6) } as CSSProperties,
    colLiverySpacer: { width: m(30), marginRight: m(6) } as CSSProperties,
    colTyr: { width: 38, marginRight: m(4), textAlign: "center" } as CSSProperties,

    rowSep: { height: 1, backgroundColor: C.border } as CSSProperties,

    elimLine: {
      alignItems: "center", justifyContent: "center", paddingTop: m(3), paddingBottom: m(3),
      backgroundColor: C.accentDim, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.accent,
    } as CSSProperties,

    driverRow: { flexDirection: "row", alignItems: "center", paddingTop: m(8), paddingBottom: m(8), paddingRight: m(8), minHeight: m(48), ...(isDesktop ? { justifyContent: "space-between" } : {}) } as CSSProperties,
    teamStripe: { width: 3, height: m(38), marginRight: m(6) } as CSSProperties,
    liveryWrap: { width: m(30), height: m(20), marginRight: m(6), alignItems: "center", justifyContent: "center" } as CSSProperties,
    livery: { width: m(30), height: m(20) } as CSSProperties,

    posWrap: { width: 34, alignItems: "flex-start", paddingLeft: 4 } as CSSProperties,
    // Driver name gets a fixed width on desktop instead of flex:1, so the
    // row's justifyContent spreads leftover space across all columns
    // instead of piling it all into one gap after DRIVER.
    driverCol: isDesktop ? ({ width: 200 } as CSSProperties) : ({ flex: 1, minWidth: 70 } as CSSProperties),
    gapCol: { width: 62 } as CSSProperties,

    tireBadge: { width: 38, borderWidth: 1, alignItems: "center", paddingTop: m(2), paddingBottom: m(2), marginRight: m(4) } as CSSProperties,
    tireCompound: { fontFamily: "PressStart2P", fontSize: 9, fontWeight: 900 } as CSSProperties,
    tireAge: { fontFamily: "PressStart2P", fontSize: 6, color: "#888", marginTop: 1 } as CSSProperties,

    // Was column-stacked (S1/S2/S3 on top of each other) because
    // sectorWrapper was referenced but never actually defined — so the
    // three cells fell back to View's default column layout. Fixed to a
    // real horizontal row, with extra breathing room on desktop.
    sectorsCol: {
      width: isDesktop ? 120 : 80,
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    } as CSSProperties,
    sectorWrapper: { alignItems: "center" } as CSSProperties,
    sectorText: { fontFamily: "PressStart2P", fontSize: 6, color: C.grey } as CSSProperties,

    lapCol: { width: 65, alignItems: "flex-end" } as CSSProperties,
    lapText: { fontFamily: "PressStart2P", fontSize: 6, color: C.white } as CSSProperties,
  });
}
