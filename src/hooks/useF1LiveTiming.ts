import { useEffect, useMemo, useRef, useState } from "react";

import type { LeaderboardRow } from "./useOpenF1";

// Uses the browser's built-in EventSource — no library needed on web. It
// auto-reconnects on its own, so there's no react-native-sse-style timeout/
// polling config to port.

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

export type RaceControlItem = {
  utc: string;
  category: string;
  flag: string;
  message: string;
  lap: number | null;
  racingNumber: string | null;
};

export type SessionMeta = {
  name: string;         // "Qualifying" | "Race" | "Practice 1" | "Sprint" ...
  meetingName: string;  // "Dutch Grand Prix"
  country: string;
  location: string;
  circuit: string;
  status: string;       // raw SessionStatus.Status ("Started" | "Finished" | ...)
  live: boolean;        // session currently running
  finished: boolean;
  part: number | null;  // qualifying segment 1/2/3 (else null)
  noEntries: number[] | null; // cars per part, e.g. [22,16,10]
  clock: string | null;      // ExtrapolatedClock.Remaining ("HH:MM:SS")
  clockUtc: string | null;   // timestamp that Remaining was accurate at
  extrapolating: boolean;    // true = count down locally from clock/clockUtc
  gmtOffset: string | null;  // track UTC offset, e.g. "02:00:00"
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
      knockedOut: t.KnockedOut === true,
      cutoff: t.Cutoff === true,
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
    const es = new EventSource(url);

    const onInitial = (event: MessageEvent) => {
      try {
        stateRef.current = JSON.parse(event.data);
        dirtyRef.current = true;
        setHasError(false);
      } catch {
        // ignore malformed frame
      }
    };

    const onUpdate = (event: MessageEvent) => {
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
      es.removeEventListener("initial", onInitial as EventListener);
      es.removeEventListener("update", onUpdate as EventListener);
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

  // Session identity straight from the live feed — authoritative for "what's
  // live right now", so the UI doesn't depend on OpenF1's (paywalled/rate-
  // limited) calendar during a session.
  const session = useMemo<SessionMeta | null>(() => {
    const info = stateRef.current?.SessionInfo;
    const rawStatus = stateRef.current?.SessionStatus?.Status;
    const td = stateRef.current?.TimingData;
    if (!info && !rawStatus) return null;
    const status = typeof rawStatus === "string" ? rawStatus : "";
    return {
      name: info?.Name ?? "SESSION",
      meetingName: info?.Meeting?.Name ?? "",
      country: info?.Meeting?.Country?.Name ?? "",
      location: info?.Meeting?.Location ?? "",
      circuit: info?.Meeting?.Circuit?.ShortName ?? "",
      status,
      live: status === "Started" || status === "Aborted", // Aborted = red flag
      finished: status === "Finished" || status === "Finalised" || status === "Ends",
      part: typeof td?.SessionPart === "number" ? td.SessionPart : null,
      noEntries: Array.isArray(td?.NoEntries) ? td.NoEntries : null,
      clock: typeof stateRef.current?.ExtrapolatedClock?.Remaining === "string"
        ? stateRef.current.ExtrapolatedClock.Remaining
        : null,
      clockUtc: typeof stateRef.current?.ExtrapolatedClock?.Utc === "string"
        ? stateRef.current.ExtrapolatedClock.Utc
        : null,
      extrapolating: stateRef.current?.ExtrapolatedClock?.Extrapolating === true,
      gmtOffset: typeof info?.GmtOffset === "string" ? info.GmtOffset : null,
    };
  }, [tick]);

  // Race control feed, newest first. Messages arrive as an array (initial)
  // that later updates append to by numeric index, so normalize both.
  const raceControl = useMemo<RaceControlItem[]>(() => {
    const raw = stateRef.current?.RaceControlMessages?.Messages;
    const list: any[] = Array.isArray(raw) ? raw : Object.values(raw ?? {});
    return list
      .map((m) => ({
        utc: typeof m?.Utc === "string" ? m.Utc : "",
        category: typeof m?.Category === "string" ? m.Category : "",
        flag: typeof m?.Flag === "string" ? m.Flag : "",
        message: typeof m?.Message === "string" ? m.Message : "",
        lap: toNumber(m?.Lap),
        racingNumber: m?.RacingNumber != null ? String(m.RacingNumber) : null,
      }))
      .filter((m) => m.message)
      .sort((a, b) => (b.utc > a.utc ? 1 : b.utc < a.utc ? -1 : 0));
  }, [tick]);

  return {
    rows,
    top3: rows.slice(0, 3),
    currentLap,
    totalLaps,
    latestWeather,
    trackStatus,
    raceControl,
    session,
    connected,
    isLoading: enabled && !connected && rows.length === 0,
    hasError,
  };
}
