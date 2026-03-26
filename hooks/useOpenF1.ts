import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  getDrivers, getLaps, getPositions, getSessions, getWeather,
  getStints, getIntervals, getMeetings,
  getDriverChampionshipStandings, getConstructorChampionshipStandings, getLastRaceResults,
} from '../services/api/openf1-client';

// ── Types ──────────────────────────────────────────────────────
export type RaceSession = {
  session_key: number;
  session_name?: string;
  session_type?: string;
  date_start?: string;
  date_end?: string;
  country_name?: string;
  country_code?: string;
  location?: string;
  circuit_short_name?: string;
  meeting_name?: string;
  meeting_key?: number;
  year?: number;
};

type Driver = {
  driver_number: number;
  full_name?: string;
  name_acronym?: string;
  team_name?: string;
  team_colour?: string;
};

type PositionPoint = {
  driver_number: number;
  position?: number;
  date?: string;
};

type Lap = {
  driver_number: number;
  lap_number?: number;
  lap_duration?: number;
  duration_sector_1?: number;
  duration_sector_2?: number;
  duration_sector_3?: number;
};

type WeatherPoint = {
  air_temperature?: number;
  track_temperature?: number;
  humidity?: number;
  wind_speed?: number;
  rainfall?: boolean;
};

type Stint = {
  driver_number: number;
  stint_number?: number;
  compound?: string;
  lap_start?: number;
  lap_end?: number;
  tyre_age_at_start?: number;
};

type IntervalPoint = {
  driver_number: number;
  interval?: number | null;
  gap_to_leader?: number | null;
  date?: string;
};

export type LeaderboardRow = {
  driverNumber: number;
  position: number;
  name: string;
  short: string;
  team: string;
  teamColor: string;
  lapNumber: number | null;
  lapTime: number | null;
  bestLapTime: number | null;
  gap: string;
  gapToNext: string;
  sectorTimes: [number | null, number | null, number | null];
  compound: string;
  tireAge: number;
  pits: number;
};

export type DriverStanding = {
  pos: number;
  name: string;
  short: string;
  team: string;
  teamColor: string;
  points: number;
  wins: number;
};

export type ConstructorStanding = {
  pos: number;
  name: string;
  teamColor: string;
  points: number;
  wins: number;
};

export type LastRaceResult = {
  pos: number;
  name: string;
  short: string;
  team: string;
  teamColor: string;
};

// ── Team colour map for Jolpica data ──────────────────────────
const TEAM_COLORS_BY_NAME: Record<string, string> = {
  'Red Bull': '#3671C6',
  'McLaren': '#FF8000',
  'Ferrari': '#E8002D',
  'Mercedes': '#27F4D2',
  'Aston Martin': '#229971',
  'Alpine': '#FF87BC',
  'Williams': '#64C4FF',
  'RB': '#6692FF',
  'Haas': '#B6BABD',
  'Sauber': '#52E252',
  'Kick Sauber': '#52E252',
};

function getTeamColor(teamName: string): string {
  for (const [key, color] of Object.entries(TEAM_COLORS_BY_NAME)) {
    if (teamName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(teamName.toLowerCase())) {
      return color;
    }
  }
  return '#888888';
}

// ── Helpers ────────────────────────────────────────────────────
export function parseDate(value?: string): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function normalizeHex(color?: string): string {
  if (!color) return '#888888';
  if (color.startsWith('#')) return color;
  return `#${color}`;
}

export function formatLapTime(value?: number | null): string {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    return '--:--.---';
  }
  const minutes = Math.floor(value / 60);
  const seconds = value - minutes * 60;
  const secondsPadded = seconds.toFixed(3).padStart(6, '0');
  return `${minutes}:${secondsPadded}`;
}

export function formatSectorTime(value?: number | null): string {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) return '--.-';
  return value.toFixed(3);
}

// ── Status ─────────────────────────────────────────────────────
export function getRaceStatus(session: RaceSession, now: number): 'live' | 'done' | 'upcoming' {
  const start = parseDate(session.date_start);
  const end = parseDate(session.date_end);
  if (start <= now && now <= end) return 'live';
  if (end > 0 && end < now) return 'done';
  return 'upcoming';
}

// ── Season standings (Jolpica/Ergast) ──────────────────────────
export function useDriverStandings() {
  const year = new Date().getFullYear();
  return useQuery<DriverStanding[]>({
    queryKey: ['jolpika-driver-standings', year],
    queryFn: async () => {
      const data = await getDriverChampionshipStandings(year);
      const list = data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? [];
      return list.map((item: any) => ({
        pos: Number(item.position),
        name: `${item.Driver?.givenName ?? ''} ${item.Driver?.familyName ?? ''}`.trim(),
        short: item.Driver?.code ?? item.Driver?.familyName?.slice(0, 3).toUpperCase() ?? '---',
        team: item.Constructors?.[0]?.name ?? 'Unknown',
        teamColor: getTeamColor(item.Constructors?.[0]?.name ?? ''),
        points: Number(item.points),
        wins: Number(item.wins),
      }));
    },
    refetchInterval: 300000, // 5 min
    staleTime: 60000,
  });
}

export function useConstructorStandings() {
  const year = new Date().getFullYear();
  return useQuery<ConstructorStanding[]>({
    queryKey: ['jolpika-constructor-standings', year],
    queryFn: async () => {
      const data = await getConstructorChampionshipStandings(year);
      const list = data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings ?? [];
      return list.map((item: any) => ({
        pos: Number(item.position),
        name: item.Constructor?.name ?? 'Unknown',
        teamColor: getTeamColor(item.Constructor?.name ?? ''),
        points: Number(item.points),
        wins: Number(item.wins),
      }));
    },
    refetchInterval: 300000,
    staleTime: 60000,
  });
}

export function useLastRaceResults() {
  const year = new Date().getFullYear();
  return useQuery<LastRaceResult[]>({
    queryKey: ['jolpika-last-race', year],
    queryFn: async () => {
      const data = await getLastRaceResults(year);
      const results = data?.MRData?.RaceTable?.Races?.[0]?.Results ?? [];
      return results.slice(0, 10).map((item: any) => ({
        pos: Number(item.position),
        name: `${item.Driver?.givenName ?? ''} ${item.Driver?.familyName ?? ''}`.trim(),
        short: item.Driver?.code ?? item.Driver?.familyName?.slice(0, 3).toUpperCase() ?? '---',
        team: item.Constructor?.name ?? 'Unknown',
        teamColor: getTeamColor(item.Constructor?.name ?? ''),
      }));
    },
    refetchInterval: 300000,
    staleTime: 60000,
  });
}

// ── All sessions for schedule ───────────────────────────────────
export function useAllSessions() {
  const year = new Date().getFullYear();
  return useQuery({
    queryKey: ['all-sessions', year],
    queryFn: () => getSessions({ year }),
    refetchInterval: 120000,
    staleTime: 60000,
  });
}

// ── Race sessions (for live detection) ─────────────────────────
export function useRaceSessions() {
  const year = new Date().getFullYear();
  return useQuery({
    queryKey: ['sessions', 'race-year', year],
    queryFn: () => getSessions({ year, session_type: 'Race' }),
    refetchInterval: 60000,
  });
}

export function useActiveRaceSession() {
  const sessionsQuery = useRaceSessions();

  const data = useMemo(() => {
    const now = Date.now();
    const sessions = (Array.isArray(sessionsQuery.data) ? sessionsQuery.data : []) as RaceSession[];
    const races = sessions
      .filter((session) => session.session_type === 'Race')
      .sort((a, b) => parseDate(a.date_start) - parseDate(b.date_start));

    const live = races.find((session) => {
      const start = parseDate(session.date_start);
      const end = parseDate(session.date_end);
      return start > 0 && end > 0 && start <= now && now <= end;
    });

    const next = races.find((session) => parseDate(session.date_start) > now);

    const latestPast = [...races]
      .filter((session) => parseDate(session.date_end) <= now)
      .sort((a, b) => parseDate(b.date_end) - parseDate(a.date_end))[0];

    return {
      races,
      liveRace: live ?? null,
      nextRace: next ?? null,
      activeRace: live ?? latestPast ?? races[0] ?? null,
      latestPastRace: latestPast ?? null,
    };
  }, [sessionsQuery.data]);

  return {
    ...sessionsQuery,
    ...data,
  };
}

// ── Live race data ─────────────────────────────────────────────
export function useLiveRaceData(sessionKey: number | null) {
  const enabled = typeof sessionKey === 'number' && sessionKey > 0;

  const positionsQuery = useQuery({
    queryKey: ['position', sessionKey],
    queryFn: () => getPositions({ session_key: sessionKey as number }),
    enabled,
    refetchInterval: 2500,
  });

  const driversQuery = useQuery({
    queryKey: ['drivers', sessionKey],
    queryFn: () => getDrivers({ session_key: sessionKey as number }),
    enabled,
    refetchInterval: 30000,
  });

  const lapsQuery = useQuery({
    queryKey: ['laps', sessionKey],
    queryFn: () => getLaps({ session_key: sessionKey as number }),
    enabled,
    refetchInterval: 5000,
  });

  const weatherQuery = useQuery({
    queryKey: ['weather', sessionKey],
    queryFn: () => getWeather({ session_key: sessionKey as number }),
    enabled,
    refetchInterval: 30000,
  });

  const stintsQuery = useQuery({
    queryKey: ['stints', sessionKey],
    queryFn: () => getStints({ session_key: sessionKey as number }),
    enabled,
    refetchInterval: 10000,
  });

  const intervalsQuery = useQuery({
    queryKey: ['intervals', sessionKey],
    queryFn: () => getIntervals({ session_key: sessionKey as number }),
    enabled,
    refetchInterval: 3000,
  });

  const rows = useMemo(() => {
    const positionData = (Array.isArray(positionsQuery.data) ? positionsQuery.data : []) as PositionPoint[];
    const driversData = (Array.isArray(driversQuery.data) ? driversQuery.data : []) as Driver[];
    const lapsData = (Array.isArray(lapsQuery.data) ? lapsQuery.data : []) as Lap[];
    const stintsData = (Array.isArray(stintsQuery.data) ? stintsQuery.data : []) as Stint[];
    const intervalsData = (Array.isArray(intervalsQuery.data) ? intervalsQuery.data : []) as IntervalPoint[];

    // Latest position per driver
    const latestPositionByDriver = new Map<number, PositionPoint>();
    const sortedPositionData = [...positionData].sort((a, b) => parseDate(b.date) - parseDate(a.date));
    for (const point of sortedPositionData) {
      if (!latestPositionByDriver.has(point.driver_number)) {
        latestPositionByDriver.set(point.driver_number, point);
      }
    }

    const driverMap = new Map<number, Driver>(driversData.map((d) => [d.driver_number, d]));

    // Latest lap per driver (for last lap time + sector times)
    const latestLapByDriver = new Map<number, Lap>();
    // Best lap per driver
    const bestLapByDriver = new Map<number, Lap>();
    for (const lap of lapsData) {
      const current = latestLapByDriver.get(lap.driver_number);
      if (!current || (lap.lap_number ?? -1) >= (current.lap_number ?? -1)) {
        latestLapByDriver.set(lap.driver_number, lap);
      }
      if (lap.lap_duration != null && lap.lap_duration > 0) {
        const best = bestLapByDriver.get(lap.driver_number);
        if (!best || (best.lap_duration ?? Infinity) > lap.lap_duration) {
          bestLapByDriver.set(lap.driver_number, lap);
        }
      }
    }

    // Current stint per driver
    const currentStintByDriver = new Map<number, Stint>();
    for (const stint of stintsData) {
      const cur = currentStintByDriver.get(stint.driver_number);
      if (!cur || (stint.stint_number ?? 0) > (cur.stint_number ?? 0)) {
        currentStintByDriver.set(stint.driver_number, stint);
      }
    }

    // Pit count per driver = max stint_number
    const pitsByDriver = new Map<number, number>();
    for (const stint of stintsData) {
      const current = pitsByDriver.get(stint.driver_number) ?? 0;
      const n = (stint.stint_number ?? 1) - 1; // stints - 1 = pit stops
      if (n > current) pitsByDriver.set(stint.driver_number, n);
    }

    // Latest interval per driver
    const latestIntervalByDriver = new Map<number, IntervalPoint>();
    const sortedIntervals = [...intervalsData].sort((a, b) => parseDate(b.date) - parseDate(a.date));
    for (const iv of sortedIntervals) {
      if (!latestIntervalByDriver.has(iv.driver_number)) {
        latestIntervalByDriver.set(iv.driver_number, iv);
      }
    }

    const mergedRows: LeaderboardRow[] = [];
    latestPositionByDriver.forEach((positionPoint, driverNumber) => {
      const driver = driverMap.get(driverNumber);
      const lap = latestLapByDriver.get(driverNumber);
      const bestLap = bestLapByDriver.get(driverNumber);
      const stint = currentStintByDriver.get(driverNumber);
      const pits = pitsByDriver.get(driverNumber) ?? 0;
      const interval = latestIntervalByDriver.get(driverNumber);
      const position = positionPoint.position ?? 999;

      const lapStart = stint?.lap_start ?? 0;
      const currentLapNum = lap?.lap_number ?? 0;
      const tireAge = stint?.tyre_age_at_start != null
        ? stint.tyre_age_at_start + Math.max(0, currentLapNum - lapStart)
        : currentLapNum - lapStart;

      let gapToNext = '--';
      if (interval?.interval != null) {
        const iv = interval.interval;
        if (iv === null) gapToNext = '--';
        else gapToNext = `+${typeof iv === 'number' ? iv.toFixed(3) : iv}`;
      }

      let gapToLeader = '--';
      if (position <= 1) {
        gapToLeader = 'LEADER';
        gapToNext = 'LEADER';
      } else if (interval?.gap_to_leader != null) {
        const gl = interval.gap_to_leader;
        gapToLeader = gl != null ? `+${typeof gl === 'number' ? gl.toFixed(3) : gl}` : '--';
      }

      mergedRows.push({
        driverNumber,
        position,
        name: driver?.full_name ?? `Driver #${driverNumber}`,
        short: driver?.name_acronym ?? String(driverNumber),
        team: driver?.team_name ?? 'Unknown Team',
        teamColor: normalizeHex(driver?.team_colour),
        lapNumber: typeof lap?.lap_number === 'number' ? lap.lap_number : null,
        lapTime: typeof lap?.lap_duration === 'number' ? lap.lap_duration : null,
        bestLapTime: typeof bestLap?.lap_duration === 'number' ? bestLap.lap_duration : null,
        gap: gapToLeader,
        gapToNext,
        sectorTimes: [
          lap?.duration_sector_1 ?? null,
          lap?.duration_sector_2 ?? null,
          lap?.duration_sector_3 ?? null,
        ],
        compound: stint?.compound ?? '--',
        tireAge: Math.max(0, tireAge),
        pits,
      });
    });

    return mergedRows.sort((a, b) => a.position - b.position);
  }, [positionsQuery.data, driversQuery.data, lapsQuery.data, stintsQuery.data, intervalsQuery.data]);

  const currentLap = useMemo(() => {
    if (!rows.length) return null;
    const best = rows.reduce((max, row) => {
      const value = row.lapNumber ?? 0;
      return value > max ? value : max;
    }, 0);
    return best > 0 ? best : null;
  }, [rows]);

  const top3 = rows.slice(0, 3);

  const latestWeather = useMemo(() => {
    const weather = (Array.isArray(weatherQuery.data) ? weatherQuery.data : []) as WeatherPoint[];
    if (!weather.length) return null;
    return weather[weather.length - 1];
  }, [weatherQuery.data]);

  return {
    rows,
    top3,
    currentLap,
    latestWeather,
    isLoading:
      positionsQuery.isLoading || driversQuery.isLoading || lapsQuery.isLoading,
    hasError: !!(positionsQuery.error || driversQuery.error || lapsQuery.error),
  };
}
