import { useEffect, useMemo, useRef, useState } from "react";
import EventSource from "react-native-sse";

import type { LeaderboardRow } from "./useOpenF1";

// ── Raw F1 live-timing state (subset we consume) ───────────────
// The realtime backend streams F1's SignalR categories verbatim: an
// `initial` event with the full state, then `update` events carrying
// partial patches shaped as { "<Category>": <partial> }.

type F1State = Record<string, any>;

export type LiveWeather = {
  air_temperature?: number;
  track_temperature?: number;
  humidity?: number;
  wind_speed?: number;
  rainfall?: boolean;
};

// ── Recursive merge-patch (mirrors the server's merge) ─────────
// Objects merge key-by-key; F1 represents arrays as objects keyed by
// numeric-string index, so a numeric key patches an array element.
function merge(base: any, update: any): any {
  if (
    base && typeof base === "object" && !Array.isArray(base) &&
    update && typeof update === "object" && !Array.isArray(update)
  ) {
    for (const k of Object.keys(update)) {
      base[k] = merge(base[k], update[k]);
    }
    return base;
  }
  if (
    Array.isArray(base) &&
    update && typeof update === "object" && !Array.isArray(update)
  ) {
    for (const k of Object.keys(update)) {
      const index = Number(k);
      if (Number.isInteger(index)) {
        if (index < base.length) base[index] = merge(base[index], update[k]);
        else base.push(update[k]);
      }
    }
    return base;
  }
  return update;
}

// ── Helpers ────────────────────────────────────────────────────
function parseF1Time(value?: string | null): number | null {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(":");
  let seconds = 0;
  for (const part of parts) {
    const n = Number(part);
    if (Number.isNaN(n)) return null;
    seconds = seconds * 60 + n;
  }
  return seconds > 0 ? seconds : null;
}

function toNumber(value?: string | number | null): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function normalizeHex(color?: string): string {
  if (!color) return "#888888";
  return color.startsWith("#") ? color : `#${color}`;
}

// ── Build leaderboard rows from raw state ──────────────────────
function buildRows(state: F1State): LeaderboardRow[] {
  const timing = state?.TimingData?.Lines ?? {};
  const drivers = state?.DriverList ?? {};
  const appData = state?.TimingAppData?.Lines ?? {};

  const driverNumbers = Object.keys(timing).length
    ? Object.keys(timing)
    : Object.keys(drivers);

  const rows: LeaderboardRow[] = driverNumbers.map((num) => {
    const t = timing[num] ?? {};
    const d = drivers[num] ?? {};
    const stints: any[] = appData[num]?.Stints ?? [];
    const stint = stints.length ? stints[stints.length - 1] : undefined;

    const position = toNumber(t.Position) ?? 999;
    const retired = t.Retired === true;
    const status: LeaderboardRow["status"] = retired ? "DNF" : "RUN";

    const sectors = Array.isArray(t.Sectors) ? t.Sectors : [];
    const sectorTimes: [number | null, number | null, number | null] = [
      parseF1Time(sectors[0]?.Value) ?? parseF1Time(sectors[0]?.PreviousValue),
      parseF1Time(sectors[1]?.Value) ?? parseF1Time(sectors[1]?.PreviousValue),
      parseF1Time(sectors[2]?.Value) ?? parseF1Time(sectors[2]?.PreviousValue),
    ];

    const isLeader = position === 1;
    const gapRaw = typeof t.GapToLeader === "string" ? t.GapToLeader.trim() : "";
    const intervalRaw =
      typeof t.IntervalToPositionAhead?.Value === "string"
        ? t.IntervalToPositionAhead.Value.trim()
        : "";

    const gap = retired ? status : isLeader ? "LEADER" : gapRaw || "--";
    const gapToNext = retired ? status : isLeader ? "LEADER" : intervalRaw || "--";

    return {
      driverNumber: Number(num),
      position,
      name: d.FullName ?? d.BroadcastName ?? `Driver #${num}`,
      short: d.Tla ?? String(num),
      team: d.TeamName ?? "Unknown Team",
      teamColor: normalizeHex(d.TeamColour),
      lapNumber: toNumber(t.NumberOfLaps),
      lapTime: parseF1Time(t.LastLapTime?.Value),
      bestLapTime: parseF1Time(t.BestLapTime?.Value),
      gap,
      gapToNext,
      sectorTimes,
      compound: stint?.Compound ?? "--",
      tireAge: toNumber(stint?.TotalLaps) ?? 0,
      pits: toNumber(t.NumberOfPitStops) ?? 0,
      status,
      dnf: retired,
      dns: false,
      dsq: false,
    };
  });

  return rows.sort((a, b) => {
    const rank = (r: LeaderboardRow) => (r.status === "RUN" ? 0 : 1);
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    return a.position - b.position;
  });
}

// ── Hook ───────────────────────────────────────────────────────
export function useF1LiveTiming(baseUrl: string | null, enabled: boolean) {
  const stateRef = useRef<F1State>({});
  const dirtyRef = useRef(false);
  const [tick, setTick] = useState(0);
  const [connected, setConnected] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!enabled || !baseUrl) {
      stateRef.current = {};
      setConnected(false);
      setHasError(false);
      setTick((t) => t + 1);
      return;
    }

    const url = `${baseUrl.replace(/\/$/, "")}/api/realtime`;
    const es = new EventSource<"initial" | "update">(url, {
      // The stream has no fixed length; keep it open indefinitely.
      timeout: 0,
      timeoutBeforeConnection: 0,
      pollingInterval: 5000,
    });

    const onInitial = (event: any) => {
      try {
        stateRef.current = JSON.parse(event.data);
        dirtyRef.current = true;
        setHasError(false);
      } catch {
        // ignore malformed frame
      }
    };

    const onUpdate = (event: any) => {
      try {
        const patch = JSON.parse(event.data);
        merge(stateRef.current, patch);
        dirtyRef.current = true;
      } catch {
        // ignore malformed frame
      }
    };

    es.addEventListener("initial", onInitial);
    es.addEventListener("update", onUpdate);
    es.addEventListener("open", () => {
      setConnected(true);
      setHasError(false);
    });
    es.addEventListener("error", () => {
      setConnected(false);
      setHasError(true);
    });

    // Flush at most ~2x/sec so bursty updates don't thrash React.
    const flush = setInterval(() => {
      if (dirtyRef.current) {
        dirtyRef.current = false;
        setTick((t) => t + 1);
      }
    }, 500);

    return () => {
      clearInterval(flush);
      es.removeAllEventListeners();
      es.close();
    };
  }, [baseUrl, enabled]);

  const rows = useMemo(() => buildRows(stateRef.current), [tick]);

  const currentLap = useMemo(() => {
    const n = stateRef.current?.LapCount?.CurrentLap;
    return typeof n === "number" ? n : null;
  }, [tick]);

  const totalLaps = useMemo(() => {
    const n = stateRef.current?.LapCount?.TotalLaps;
    return typeof n === "number" ? n : null;
  }, [tick]);

  const latestWeather = useMemo<LiveWeather | null>(() => {
    const w = stateRef.current?.WeatherData;
    if (!w) return null;
    return {
      air_temperature: toNumber(w.AirTemp) ?? undefined,
      track_temperature: toNumber(w.TrackTemp) ?? undefined,
      humidity: toNumber(w.Humidity) ?? undefined,
      wind_speed: toNumber(w.WindSpeed) ?? undefined,
      rainfall: w.Rainfall != null ? Number(w.Rainfall) > 0 : undefined,
    };
  }, [tick]);

  const trackStatus = useMemo(() => {
    const s = stateRef.current?.TrackStatus;
    return s ? { status: s.Status, message: s.Message } : null;
  }, [tick]);

  return {
    rows,
    top3: rows.slice(0, 3),
    currentLap,
    totalLaps,
    latestWeather,
    trackStatus,
    connected,
    isLoading: enabled && !connected && rows.length === 0,
    hasError,
  };
}
