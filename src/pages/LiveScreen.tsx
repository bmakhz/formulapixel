import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, StatusBar, Image, ScrollView, SafeAreaView,
} from "../components/primitives";
import { useActiveRaceSession, useLiveRaceData, formatLapTime, getRaceStatus } from "../hooks/useOpenF1";
import { useF1LiveTiming, type RaceControlItem } from "../hooks/useF1LiveTiming";
import { useThemeTokens } from "../theme";
import { useSettingsStore, type LiveColumns } from "../store/useSettingsStore";
import { formatSpeed, formatTemperature } from "../utils/unitConversion";
import { teamLiverySource, trackOutlineSource } from "../utils/imageMaps";
import { sx } from "../utils/sx";

// Ported from f1-live/app/(tabs)/live.tsx

// Measures rendered text width in the actual pixel font, via an offscreen
// canvas — used to size the DRIVER column to fit the longest name/team text
// currently in the data. (Each row renders its own independent CSS grid, so
// letting the grid's own `max-content` size the column would size every
// row *separately* off just that row's text, misaligning every row against
// each other; computing one shared width up front and applying it
// everywhere is what actually keeps rows aligned.)
let measureCanvas: HTMLCanvasElement | null = null;
function measureTextWidth(text: string, fontSizePx: number, fontFamily = '"PressStart2P", monospace'): number {
  if (typeof document === "undefined") return text.length * fontSizePx * 0.7;
  measureCanvas ??= document.createElement("canvas");
  const ctx = measureCanvas.getContext("2d");
  if (!ctx) return text.length * fontSizePx * 0.7;
  ctx.font = `${fontSizePx}px ${fontFamily}`;
  return ctx.measureText(text).width;
}

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

// ── Dynamic column model ────────────────────────────────────────
// Header and rows are both driven off this one array, so they can never
// drift out of alignment, and hiding a column just drops its grid track.
type LeaderColumn = {
  key: string;
  track: string;             // grid-template-columns track for this column
  align?: "start" | "center"; // cell content alignment (default center)
  header: ReactNode;
  cell: (d: DriverItem) => ReactNode;
};

function buildColumns(opts: {
  liveColumns: LiveColumns;
  quali: boolean;
  mode: ViewMode;
  onToggleGapInt: () => void;
  driverColWidth: number;
  C: any; px: any; styles: any;
}): LeaderColumn[] {
  const { liveColumns, quali, mode, onToggleGapInt, driverColWidth, C, px, styles } = opts;
  const cols: LeaderColumn[] = [];

  if (liveColumns.pos) {
    cols.push({
      key: "pos", track: "minmax(26px, 0.5fr)",
      header: <Text style={styles.colText}>POS</Text>,
      cell: (d) => (
        <Text style={sx(px.h3, { color: d.status !== "RUN" ? C.greyDark : C.white })}>
          {d.status !== "RUN" ? "--" : String(d.position)}
        </Text>
      ),
    });
  }

  // DRIVER — always shown: team-colour stripe + car livery + name/team.
  // driverColWidth is precomputed once (measured from the actual current
  // data) and applied identically to the header and every row, so the
  // column ends exactly where the longest visible name/team ends — with no
  // per-row size drift and no clipping of long names like "Aston Martin".
  cols.push({
    key: "driver", track: `${driverColWidth}px`, align: "start",
    header: (
      // Spacer matches the stripe+livery width in the data cell below, so
      // "DRIVER" lines up with where every row's name starts — centering
      // across the whole remaining column would drift off a short,
      // left-aligned name like "NOR" since it doesn't fill the column.
      <View style={{ flexDirection: "row", alignItems: "center", width: "100%" }}>
        <View style={styles.driverHeaderSpacer} />
        <Text style={styles.colText}>DRIVER</Text>
      </View>
    ),
    cell: (d) => {
      const livery = teamLiverySource(d.team);
      return (
        <View style={styles.driverCell}>
          <View style={sx(styles.teamStripe, { backgroundColor: d.teamColor })} />
          <View style={styles.liveryWrap}>
            {livery && <Image source={livery} style={styles.livery} resizeMode="contain" />}
          </View>
          <View style={styles.driverNameBlock}>
            <Text style={sx(px.h2, { color: d.teamColor || C.white })}>{d.short}</Text>
            <Text style={sx(px.label, styles.fs5, { color: C.greyDark, marginTop: 2 })} numberOfLines={1}>
              {d.team.toUpperCase()}
            </Text>
          </View>
        </View>
      );
    },
  });

  // GAP — always shown; heading toggles gap <-> interval.
  cols.push({
    key: "gap", track: "minmax(48px, 1fr)",
    header: (
      <TouchableOpacity onClick={onToggleGapInt}>
        <Text style={sx(styles.colText, { color: C.accent })}>{mode === "gap" ? "[GAP]" : "[INT]"}</Text>
      </TouchableOpacity>
    ),
    cell: (d) => {
      const gapText = mode === "gap" ? d.gap : d.gapToNext;
      const knockedOut = d.knockedOut === true;
      const nonRunning = d.status !== "RUN";
      return (
        <Text style={sx(px.label, styles.fs6, { color: knockedOut || nonRunning || gapText === "LEADER" ? C.accent : C.white })} numberOfLines={1}>
          {knockedOut ? "OUT" : nonRunning ? d.status : gapText === "LEADER" ? "LDR" : gapText}
        </Text>
      );
    },
  });

  if (liveColumns.tyre) {
    cols.push({
      key: "tyre", track: "minmax(40px, 0.8fr)",
      header: <Text style={styles.colText}>TYR</Text>,
      cell: (d) => <TireBadge compound={d.compound} age={d.tireAge} C={C} styles={styles} />,
    });
  }

  if (liveColumns.pit) {
    cols.push({
      key: "pit", track: "minmax(30px, 0.6fr)",
      header: <Text style={styles.colText}>PIT</Text>,
      cell: (d) => (
        <View style={{ alignItems: "center" }}>
          <Text style={sx(px.label, { color: C.grey })}>{d.pits}</Text>
          <Text style={sx(px.label, styles.fs5, { color: C.greyDark })}>PIT</Text>
        </View>
      ),
    });
  }

  if (liveColumns.sectors) {
    if (quali) {
      // In qualifying, sectors of the current lap matter less than the best
      // lap — so the sectors slot collapses to a single BEST LAP column.
      cols.push({
        key: "bestlap", track: "minmax(60px, 1.5fr)",
        header: <Text style={styles.colText}>BEST LAP</Text>,
        cell: (d) => <Text style={sx(px.mono, { color: C.white })} numberOfLines={1}>{formatLapTime(d.bestLapTime)}</Text>,
      });
    } else {
      for (let i = 0; i < 3; i++) {
        cols.push({
          key: `s${i + 1}`, track: "minmax(40px, 1fr)",
          header: <Text style={styles.colText}>{`S${i + 1}`}</Text>,
          cell: (d) => <SectorCell value={d.sectorTimes[i]} styles={styles} />,
        });
      }
    }
  }

  // LAST then BEST (order swapped per request).
  if (liveColumns.last) {
    cols.push({
      key: "last", track: "minmax(50px, 1fr)",
      header: <Text style={styles.colText}>LAST</Text>,
      cell: (d) => <Text style={styles.lapText}>{formatLapTime(d.lapTime)}</Text>,
    });
  }
  if (liveColumns.best) {
    cols.push({
      key: "best", track: "minmax(50px, 1fr)",
      header: <Text style={styles.colText}>BEST</Text>,
      cell: (d) => <Text style={styles.lapText}>{formatLapTime(d.bestLapTime)}</Text>,
    });
  }

  return cols;
}

function gridTemplate(columns: LeaderColumn[]): string {
  return columns.map((c) => c.track).join(" ");
}

function LeaderHeader({ columns, styles }: { columns: LeaderColumn[]; styles: any }) {
  return (
    <View style={sx(styles.gridHeader, { gridTemplateColumns: gridTemplate(columns) })}>
      {columns.map((c) => (
        <View key={c.key} style={sx(styles.cell, c.align === "start" ? styles.cellStart : styles.cellCenter)}>
          {c.header}
        </View>
      ))}
    </View>
  );
}

function DriverRow({ driver, columns, C, styles }: { driver: DriverItem; columns: LeaderColumn[]; C: any; styles: any }) {
  const knockedOut = driver.knockedOut === true;
  const cutoff = driver.cutoff === true && !knockedOut;
  const nonRunning = driver.status !== "RUN";
  const rowBg = cutoff ? C.accentDim : nonRunning || knockedOut ? C.bgPanel : C.bg;
  const rowOpacity = knockedOut ? 0.4 : nonRunning ? 0.65 : 1;

  return (
    <View style={sx(styles.gridRow, { gridTemplateColumns: gridTemplate(columns), backgroundColor: rowBg, opacity: rowOpacity })}>
      {columns.map((c) => (
        <View key={c.key} style={sx(styles.cell, c.align === "start" ? styles.cellStart : styles.cellCenter)}>
          {c.cell(driver)}
        </View>
      ))}
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
  const styles = useMemo(() => createStyles(C, scaleValue), [C, scaleValue]);
  const [mode, setMode] = useState<ViewMode>("gap");
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const speedUnit = useSettingsStore((s) => s.speedUnit);
  const temperatureUnit = useSettingsStore((s) => s.temperatureUnit);
  const realtimeUrl = useSettingsStore((s) => s.realtimeUrl);
  const liveColumns = useSettingsStore((s) => s.liveColumns);
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

  // One shared DRIVER column width, measured from the actual current data
  // (longest driver code / team name) plus the stripe+livery offset — see
  // measureTextWidth's note on why this can't be delegated to the grid's
  // own auto-sizing (rows are independent grids, so that sizes each row
  // off only its own content and misaligns every row against the others).
  const driverColWidth = useMemo(() => {
    const offset = Number(styles.driverHeaderSpacer.width) || 0;
    const codeSize = Number(px.h2.fontSize) || 10;
    const teamSize = Number(styles.fs5.fontSize) || 6;
    const headerSize = Number(styles.colText.fontSize) || 8;
    let maxTextWidth = measureTextWidth("DRIVER", headerSize);
    for (const row of liveData.rows) {
      maxTextWidth = Math.max(maxTextWidth, measureTextWidth(row.short ?? "", codeSize));
      maxTextWidth = Math.max(maxTextWidth, measureTextWidth((row.team ?? "").toUpperCase(), teamSize));
    }
    // Small safety margin: canvas measureText() and the browser's actual DOM
    // text layout round slightly differently, especially for a bitmap-style
    // font like this — without it, the longest name (e.g. "Red Bull Racing")
    // can end up a couple px too tight and ellipsize.
    return Math.max(120, Math.round(offset + maxTextWidth) + 10);
  }, [liveData.rows, px, styles]);

  // Visible columns drive both the header and every row's grid template, so
  // they stay aligned and the layout reflows when the user toggles columns.
  const columns = useMemo(
    () => buildColumns({
      liveColumns,
      quali: isQuali && useSse,
      mode,
      onToggleGapInt: () => setMode((mo) => (mo === "gap" ? "interval" : "gap")),
      driverColWidth,
      C, px, styles,
    }),
    [liveColumns, isQuali, useSse, mode, driverColWidth, C, px, styles],
  );

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
            <Text style={sx(px.label, styles.fs5, { color: C.greyDark })}>{w.label}</Text>
            <Text style={sx(px.label, styles.fs6, { color: C.cyan })}>{w.value}</Text>
          </View>
        ))}
      </View>

      <RaceControlPanel messages={raceControl} offMs={offMs} trackTime={trackTime} C={C} px={px} styles={styles} />

      <LeaderHeader columns={columns} styles={styles} />

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
              <DriverRow driver={item} columns={columns} C={C} styles={styles} />
              {cutoffAfter != null && index === cutoffAfter - 1 && (
                <View style={styles.elimLine}>
                  <Text style={sx(px.label, styles.fs6, { color: C.accent })}>▼ ELIMINATION ▼</Text>
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

function createStyles(C: any, scale: number) {
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

    // ── Leaderboard grid: header + every row share one column template, so
    // they always align; equal columnGap gives even spacing; cells center
    // their content under each heading. Hiding a column drops its track.
    gridHeader: {
      display: "grid", alignItems: "center", columnGap: m(10),
      paddingLeft: m(8), paddingRight: m(8), paddingTop: m(8), paddingBottom: m(8),
      borderBottomWidth: 1, borderBottomColor: C.borderBright, backgroundColor: C.bgPanel,
    } as CSSProperties,
    gridRow: {
      display: "grid", alignItems: "center", columnGap: m(10),
      paddingLeft: m(8), paddingRight: m(8), minHeight: m(48),
    } as CSSProperties,
    cell: { flexDirection: "row", alignItems: "center", minWidth: 0, overflow: "hidden" } as CSSProperties,
    cellCenter: { justifyContent: "center", textAlign: "center" } as CSSProperties,
    cellStart: { justifyContent: "flex-start" } as CSSProperties,

    colText: { fontFamily: "PressStart2P", fontSize: m(6), color: C.grey } as CSSProperties,
    rowSep: { height: 1, backgroundColor: C.border } as CSSProperties,

    // Scaled replacements for what used to be raw fontSize:5/6/7 overrides
    // scattered through the file — those bypassed scaling entirely, which is
    // why numbers/labels weren't growing with the rest of the UI.
    fs5: { fontSize: m(5) } as CSSProperties,
    fs6: { fontSize: m(6) } as CSSProperties,
    fs7: { fontSize: m(7) } as CSSProperties,

    elimLine: {
      alignItems: "center", justifyContent: "center", paddingTop: m(3), paddingBottom: m(3),
      backgroundColor: C.accentDim, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.accent,
    } as CSSProperties,

    // Driver identity cluster: colour stripe + car livery + name/team.
    driverCell: { flexDirection: "row", alignItems: "center", gap: m(6), minWidth: 0 } as CSSProperties,
    driverNameBlock: { minWidth: 0, flexShrink: 1 } as CSSProperties,
    teamStripe: { width: 3, height: m(38), flexShrink: 0 } as CSSProperties,
    liveryWrap: { width: m(30), height: m(20), alignItems: "center", justifyContent: "center", flexShrink: 0 } as CSSProperties,
    livery: { width: m(30), height: m(20) } as CSSProperties,
    // Matches teamStripe + gap + liveryWrap + gap exactly, so the "DRIVER"
    // heading text can sit centered over just the name — not the whole
    // stripe+livery+name cluster — the same way the data rows read.
    driverHeaderSpacer: { width: 3 + m(6) * 2 + m(30), flexShrink: 0 } as CSSProperties,

    tireBadge: { width: 38, borderWidth: 1, alignItems: "center", paddingTop: m(2), paddingBottom: m(2) } as CSSProperties,
    tireCompound: { fontFamily: "PressStart2P", fontSize: m(9), fontWeight: 900 } as CSSProperties,
    tireAge: { fontFamily: "PressStart2P", fontSize: m(6), color: "#888", marginTop: 1 } as CSSProperties,

    sectorText: { fontFamily: "PressStart2P", fontSize: m(6), color: C.grey } as CSSProperties,
    lapText: { fontFamily: "PressStart2P", fontSize: m(6), color: C.white } as CSSProperties,
  });
}
