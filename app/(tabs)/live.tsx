import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, Animated, StatusBar, Image, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useActiveRaceSession, useLiveRaceData, formatLapTime, getRaceStatus } from "../../hooks/useOpenF1";
import { useF1LiveTiming, type RaceControlItem } from "../../hooks/useF1LiveTiming";
import { useThemeTokens } from "../../components/theme";
import { useSettingsStore } from "../../store/useSettingsStore";
import { formatSpeed, formatTemperature } from "../../utils/unitConversion";
import { teamLiverySource, trackOutlineSource } from "../../utils/imageMaps";

type ViewMode = "gap" | "interval";

// ── Pulsing live dot ────────────────────────────────────────────
function BlinkDot({ color }: { color: string }) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return <Animated.View style={{ width: 6, height: 6, backgroundColor: color, opacity: anim }} />;
}

// ── Tyre badge ──────────────────────────────────────────────────
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
    <View style={[styles.tireBadge, { borderColor: color, backgroundColor: C.bgCard }]}>
      <Text style={[styles.tireCompound, { color }]}>{short}</Text>
      <Text style={[styles.tireAge]}>{age}</Text>
    </View>
  );
}

// ── Sector time ─────────────────────────────────────────────────
function SectorCell({ value, styles }: { value: number | null; styles: any }) {
  const text = value != null && value > 0 ? value.toFixed(2) : "--.-";
  return <Text style={styles.sectorText}>{text}</Text>;
}

// ── Driver row ──────────────────────────────────────────────────
type DriverItem = ReturnType<typeof useLiveRaceData>["rows"][number];

function DriverRow({ driver, mode, quali, C, px, styles }: { driver: DriverItem; mode: ViewMode; quali?: boolean; C: any; px: any; styles: any }) {
  const gapText = mode === "gap" ? driver.gap : driver.gapToNext;
  const knockedOut = driver.knockedOut === true;
  const cutoff = driver.cutoff === true && !knockedOut; // in the drop zone now
  const nonRunning = driver.status !== "RUN";
  const rowBg = cutoff ? C.accentDim : nonRunning || knockedOut ? C.bgPanel : C.bg;
  const rowOpacity = knockedOut ? 0.4 : nonRunning ? 0.65 : 1;
  const livery = teamLiverySource(driver.team);

  return (
    <View style={[styles.driverRow, { backgroundColor: rowBg, opacity: rowOpacity }]}>
      {/* Team stripe */}
      <View style={[styles.teamStripe, { backgroundColor: driver.teamColor }]} />

      {/* POS */}
      <View style={styles.posWrap}>
        <Text style={[px.h3, { color: driver.status !== "RUN" ? C.greyDark : C.white }]}>{driver.status !== "RUN" ? "--" : String(driver.position).padStart(2, " ")}</Text>
      </View>

      {/* Fixed-width slot so rows align whether or not a livery resolves */}
      <View style={styles.liveryWrap}>
        {livery && <Image source={livery} style={styles.livery} resizeMode="contain" />}
      </View>

      {/* DRIVER */}
      <View style={styles.driverCol}>
        <Text style={[px.h2, { color: driver.teamColor || C.white }]}>{driver.short}</Text>
        <Text style={[px.label, { color: C.greyDark, marginTop: 2, fontSize: 5 }]} numberOfLines={1}>
          {driver.team.toUpperCase().slice(0, 10)}
        </Text>
      </View>

      {/* GAP */}
      <View style={styles.gapCol}>
        <Text style={[px.label, { color: knockedOut || nonRunning || gapText === "LEADER" ? C.accent : C.white, fontSize: 6 }]} numberOfLines={1}>
          {knockedOut ? "OUT" : nonRunning ? driver.status : gapText === "LEADER" ? "LDR" : gapText}
        </Text>
      </View>

      {/* TYRE + AGE */}
      <TireBadge compound={driver.compound} age={driver.tireAge} C={C} styles={styles} />

      {/* PITS */}
      <View style={styles.pitsCol}>
        <Text style={[px.label, { color: C.grey }]}>{driver.pits}</Text>
        <Text style={[px.label, { color: C.greyDark, fontSize: 5 }]}>PIT</Text>
      </View>

      {/* Quali: best lap time. Otherwise: S1 S2 S3 sectors */}
      {quali ? (
        <View style={styles.sectorsCol}>
          <Text style={[px.mono, { fontSize: 7, color: C.white, textAlign: "center" }]} numberOfLines={1}>
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

      {/* BEST LAP */}
      <View style={styles.lapCol}>
        <Text style={styles.lapText}>{formatLapTime(driver.bestLapTime)}</Text>
      </View>

      {/* LAST LAP */}
      <View style={styles.lapCol}>
        <Text style={styles.lapText}>{formatLapTime(driver.lapTime)}</Text>
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

// Live segment countdown: extrapolate locally from the last known value.
function liveCountdown(sess: { clock: string | null; clockUtc: string | null; extrapolating: boolean } | null, nowMs: number): string | null {
  const base = parseHMS(sess?.clock);
  if (base == null) return null;
  if (!sess?.extrapolating || !sess?.clockUtc) return formatCountdown(base);
  const anchor = Date.parse(/[Zz]$|[+\-]\d{2}:?\d{2}$/.test(sess.clockUtc) ? sess.clockUtc : sess.clockUtc + "Z");
  if (Number.isNaN(anchor)) return formatCountdown(base);
  return formatCountdown(base - (nowMs - anchor) / 1000);
}

// Track UTC offset ("02:00:00" / "-05:00:00") -> milliseconds.
function offsetMs(gmt?: string | null): number {
  if (!gmt) return 0;
  const m = gmt.match(/(-?)(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return 0;
  const sign = m[1] === "-" ? -1 : 1;
  return sign * (Number(m[2]) * 3600 + Number(m[3]) * 60 + Number(m[4] || 0)) * 1000;
}

// Format a UTC instant (ms) in track-local time.
function trackHHMMSS(ms: number, offMs: number, withSeconds = true): string {
  const d = new Date(ms + offMs);
  const p = (n: number) => String(n).padStart(2, "0");
  const base = `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
  return withSeconds ? `${base}:${p(d.getUTCSeconds())}` : base;
}

// A feed UTC string ("2026-08-22T14:31:27" or with Z) -> track-local HH:MM.
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
      <TouchableOpacity activeOpacity={0.8} onPress={() => setOpen((o) => !o)} style={styles.rcHeader}>
        <View style={[styles.rcStripe, { backgroundColor: rcColor(latest.flag, latest.category, C) }]} />
        <Text style={[px.label, { color: C.accent }]}>RC</Text>
        {!open && (
          <Text style={[px.label, { color: C.white, flex: 1 }]} numberOfLines={1}>
            {latest.message}
          </Text>
        )}
        {open && <Text style={[px.label, { color: C.grey, flex: 1 }]}>RACE CONTROL</Text>}
        {trackTime && <Text style={[px.label, { color: C.cyan }]}>{trackTime}</Text>}
        <Text style={[px.label, { color: C.grey }]}>{messages.length}</Text>
        <Text style={[px.label, { color: C.accent }]}>{open ? "[-]" : "[+]"}</Text>
      </TouchableOpacity>

      {open && (
        <ScrollView style={styles.rcList} showsVerticalScrollIndicator={false}>
          {shown.map((m, i) => (
            <View key={`${m.utc}-${i}`} style={styles.rcRow}>
              <View style={[styles.rcRowStripe, { backgroundColor: rcColor(m.flag, m.category, C) }]} />
              <Text style={[px.label, { color: C.greyDark, width: 34 }]}>{toTrackTime(m.utc, offMs)}</Text>
              {m.racingNumber && (
                <Text style={[px.label, { color: C.cyan, width: 18 }]}>#{m.racingNumber}</Text>
              )}
              <Text style={[px.label, { color: C.white, flex: 1, lineHeight: 10 }]}>{m.message}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ── Main screen ─────────────────────────────────────────────────
export default function LiveScreen() {
  const { C, px, statusBarStyle, mode: themeMode, scaleValue } = useThemeTokens();
  const styles = React.useMemo(() => createStyles(C, scaleValue), [C, scaleValue]);
  const [mode, setMode] = useState<ViewMode>("gap");
  // 1s ticker drives the extrapolated segment countdown + the track clock.
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

  // The SSE relay is the source of truth for live sessions: it self-describes
  // the session and carries all timing, so we don't depend on OpenF1's
  // (paywalled during the live window, and rate-limited) calendar here.
  // Connect whenever the Live tab is open and a backend URL is configured.
  const sseData = useF1LiveTiming(realtimeUrl || null, !!realtimeUrl);
  const useSse = sseData.connected && sseData.rows.length > 0;

  // Only hit OpenF1's live endpoints as a fallback when SSE isn't providing
  // data — during a live session those endpoints are paywalled and would just
  // burn our rate limit (starving the schedule/standings calls).
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
  // Cutoff position: cars advancing to the next part sit above this line.
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
      <StatusBar barStyle={statusBarStyle} backgroundColor={C.bg} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.liveRow}>
            {isLive ? <BlinkDot color={C.accent} /> : <View style={{ width: 6, height: 6, backgroundColor: C.greyDark }} />}
            <Text style={[px.label, { color: isLive ? C.accent : C.grey }]}>{isLive ? "LIVE" : isRaceOver ? "FINISHED" : "LATEST"}</Text>
            <Text style={[px.label, { color: C.cyan }]}>{sessionLabel}</Text>
            {segment && <Text style={[px.label, { color: C.yellow }]}>{segment}</Text>}
            {isLive && countdown && <Text style={[px.label, { color: C.grey }]}>{countdown}</Text>}
            {isRaceOver && <Text style={[px.label, { color: C.yellow }]}>🏁</Text>}
          </View>
          <View style={styles.titleRow}>
            {trackOutline && <Image source={trackOutline} style={styles.trackOutline} resizeMode="contain" />}
            <Text style={[px.h2, { color: C.white, flex: 1 }]}>{raceName.toUpperCase().slice(0, 20)}</Text>
          </View>
        </View>
        {segment ? (
          <View style={styles.lapBox}>
            <Text style={[px.h1, { color: C.yellow }]}>{segment}</Text>
            <Text style={[px.label, { color: C.grey, marginTop: 2 }]}>{countdown ?? "--:--"}</Text>
          </View>
        ) : (
          <View style={styles.lapBox}>
            <Text style={[px.label, { color: C.grey }]}>LAP</Text>
            <Text style={[px.h1, { color: C.yellow }]}>{String(liveData.currentLap ?? "--").padStart(2, "0")}</Text>
            <Text style={[px.label, { color: C.grey }]}>/{totalLaps != null ? String(totalLaps).padStart(2, "0") : "--"}</Text>
          </View>
        )}
      </View>

      {/* ── Weather ── */}
      <View style={styles.weatherStrip}>
        {[
          { label: "AIR",  value: formatTemperature(airTemp, temperatureUnit) },
          { label: "TRK",  value: formatTemperature(trkTemp, temperatureUnit) },
          { label: "HUM",  value: liveData.latestWeather?.humidity != null ? `${Math.round(liveData.latestWeather.humidity)}%` : "--" },
          { label: "WND",  value: formatSpeed(liveData.latestWeather?.wind_speed, speedUnit) },
          { label: "RAIN", value: liveData.latestWeather?.rainfall ? "YES" : "NO" },
        ].map((w) => (
          <View key={w.label} style={styles.weatherItem}>
            <Text style={[px.label, { color: C.greyDark, fontSize: 5 }]}>{w.label}</Text>
            <Text style={[px.label, { color: C.cyan, fontSize: 6 }]}>{w.value}</Text>
          </View>
        ))}
      </View>

      {/* ── Race control ── */}
      <RaceControlPanel messages={raceControl} offMs={offMs} trackTime={trackTime} C={C} px={px} styles={styles} />

      {/* ── Column headers ── */}
      <ScrollableHeaders mode={mode} onToggle={() => setMode(m => m === "gap" ? "interval" : "gap")} quali={isQuali && useSse} C={C} styles={styles} />

      {/* ── Driver list ── */}
      {liveData.isLoading && liveData.rows.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={[px.label, { color: C.greyDark }]}>LOADING...</Text>
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
                  <Text style={[px.label, { color: C.accent, fontSize: 6 }]}>▼ ELIMINATION ▼</Text>
                </View>
              )}
            </>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 12 }}
          ItemSeparatorComponent={() => <View style={styles.rowSep} />}
          horizontal={false}
        />
      )}
    </SafeAreaView>
  );
}

function ScrollableHeaders({ mode, onToggle, quali, C, styles }: { mode: ViewMode; onToggle: () => void; quali?: boolean; C: any; styles: any }) {
  return (
    <View style={styles.colHeader}>
      {/* Spacers mirror the row's team stripe + livery slot exactly */}
      <View style={styles.colStripeSpacer} />
      <Text style={[styles.colText, { width: 34, paddingLeft: 4 }]}>POS</Text>
      <View style={styles.colLiverySpacer} />
      <Text style={[styles.colText, { flex: 1, minWidth: 70 }]}>DRIVER</Text>
      <TouchableOpacity style={{ width: 62 }} onPress={onToggle}>
        <Text style={[styles.colText, { color: C.accent }]}>{mode === "gap" ? "[GAP]" : "[INT]"}</Text>
      </TouchableOpacity>
      <Text style={[styles.colText, styles.colTyr]}>TYR</Text>
      <Text style={[styles.colText, { width: 30, textAlign: 'center' }]}>PIT</Text>
      <Text style={[styles.colText, { width: 80, paddingLeft: 2, textAlign: quali ? "center" : "left" }]}>{quali ? "BEST LAP" : "S1·S2·S3"}</Text>
      <Text style={[styles.colText, { width: 65, textAlign: 'right' }]}>BEST</Text>
      <Text style={[styles.colText, { width: 65, textAlign: 'right' }]}>LAST</Text>
    </View>
  );
}

function createStyles(C: any, scale: number) {
  const s = Math.max(0.9, Math.min(1.2, scale));
  const m = (n: number) => Math.round(n * s);
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    padding: m(12), paddingBottom: m(8),
    borderBottomWidth: 2, borderBottomColor: C.accent,
  },
  headerLeft: { gap: m(4), flex: 1 },
  liveRow: { flexDirection: "row", alignItems: "center", gap: m(6) },
  titleRow: { flexDirection: "row", alignItems: "center", gap: m(8) },
  trackOutline: { width: m(44), height: m(24) },
  lapBox: {
    borderWidth: 2, borderColor: C.yellow,
    padding: m(8), alignItems: "center", backgroundColor: C.bgCard,
  },

  weatherStrip: {
    flexDirection: "row", justifyContent: "space-around",
    paddingVertical: m(6), paddingHorizontal: m(8),
    backgroundColor: C.bgPanel,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  weatherItem: { alignItems: "center", gap: m(2) },

  rcWrap: {
    backgroundColor: C.bgPanel,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  rcHeader: {
    flexDirection: "row", alignItems: "center", gap: m(6),
    paddingHorizontal: m(9), paddingVertical: m(6),
  },
  rcStripe: { width: 3, height: m(12) },
  rcList: { maxHeight: m(150) },
  rcRow: {
    flexDirection: "row", alignItems: "center", gap: m(6),
    paddingHorizontal: m(9), paddingVertical: m(4),
    borderTopWidth: 1, borderTopColor: C.border,
  },
  rcRowStripe: { width: 3, height: m(16) },

  colHeader: {
    flexDirection: "row", alignItems: "center",
    // Match the row's box model exactly: no left pad (the stripe spacer
    // stands in for the team stripe), and the same paddingRight as a row.
    paddingLeft: 0, paddingRight: m(8), paddingVertical: m(8),
    borderBottomWidth: 1, borderBottomColor: C.borderBright,
    backgroundColor: C.bgPanel,
  },
  colText: { fontFamily: "PressStart2P", fontSize: 6, color: C.grey },
  // These three mirror teamStripe / liveryWrap / tireBadge margins 1:1 so
  // headers and data stay aligned at every scale.
  colStripeSpacer: { width: 3, marginRight: m(6) },
  colLiverySpacer: { width: m(30), marginRight: m(6) },
  colTyr: { width: 38, marginRight: m(4), textAlign: "center" },

  rowSep: { height: 1, backgroundColor: C.border },

  elimLine: {
    alignItems: "center", justifyContent: "center",
    paddingVertical: m(3),
    backgroundColor: C.accentDim,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.accent,
  },

  driverRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: m(8), paddingRight: m(8),
    minHeight: m(48),
  },
  teamStripe: { width: 3, height: m(38), marginRight: m(6) },
  liveryWrap: { width: m(30), height: m(20), marginRight: m(6), alignItems: "center", justifyContent: "center" },
  livery: { width: m(30), height: m(20) },

  posWrap:   { width: 34, alignItems: "flex-start", paddingLeft: 4 },
  driverCol: { flex: 1, minWidth: 70 },
  gapCol:    { width: 62 },

  tireBadge: { width: 38, borderWidth: 1, alignItems: "center", paddingVertical: m(2), marginRight: m(4) },
  tireCompound: { fontFamily: "PressStart2P", fontSize: 9, fontWeight: "900" },
  tireAge:      { fontFamily: "PressStart2P", fontSize: 6, color: "#888", marginTop: 1 },

  pitsCol: { width: 30, alignItems: "center" },

  sectorsCol: { width: 80, gap: 1 },
  sectorText: { fontFamily: "PressStart2P", fontSize: 6, color: C.grey },

  lapCol: { width: 65, alignItems: "flex-end" },
  lapText: { fontFamily: "PressStart2P", fontSize: 6, color: C.white },
  });
}
