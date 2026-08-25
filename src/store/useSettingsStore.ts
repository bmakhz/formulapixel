import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "dark" | "light";
export type SpeedUnit = "kmh" | "mph";
export type TemperatureUnit = "C" | "F";

export const DEFAULT_REALTIME_URL = "https://formula-pixel-realtime-latest.onrender.com";

// Toggleable Live-tab columns. Driver (name/colour/car) and GAP are always
// shown, so they're not in here. `sectors` covers S1/S2/S3 as one group.
export type LiveColumnKey = "pos" | "tyre" | "pit" | "sectors" | "best" | "last";

export type LiveColumns = Record<LiveColumnKey, boolean>;

export const DEFAULT_LIVE_COLUMNS: LiveColumns = {
  pos: true,
  tyre: true,
  pit: true,
  sectors: true,
  best: true,
  last: true,
};

type SettingsState = {
  mode: ThemeMode;
  speedUnit: SpeedUnit;
  temperatureUnit: TemperatureUnit;
  realtimeUrl: string;
  liveColumns: LiveColumns;
  setMode: (mode: ThemeMode) => void;
  setSpeedUnit: (unit: SpeedUnit) => void;
  setTemperatureUnit: (unit: TemperatureUnit) => void;
  setRealtimeUrl: (url: string) => void;
  toggleLiveColumn: (key: LiveColumnKey) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      mode: "dark",
      speedUnit: "kmh",
      temperatureUnit: "C",
      realtimeUrl: DEFAULT_REALTIME_URL,
      liveColumns: DEFAULT_LIVE_COLUMNS,
      setMode: (mode) => set({ mode }),
      setSpeedUnit: (speedUnit) => set({ speedUnit }),
      setTemperatureUnit: (temperatureUnit) => set({ temperatureUnit }),
      setRealtimeUrl: (realtimeUrl) => set({ realtimeUrl }),
      toggleLiveColumn: (key) =>
        set((state) => ({ liveColumns: { ...state.liveColumns, [key]: !state.liveColumns[key] } })),
    }),
    {
      name: "f1live-settings",
      // Web default storage is localStorage — no adapter needed here, unlike
      // the native app which needed AsyncStorage wired in explicitly.
      // v2: dropped the user-facing scale option (now fixed at "medium" in
      // theme.ts) — any leftover persisted `scale` key is simply unused.
      version: 2,
      partialize: (state) => ({
        mode: state.mode,
        speedUnit: state.speedUnit,
        temperatureUnit: state.temperatureUnit,
        realtimeUrl: state.realtimeUrl,
        liveColumns: state.liveColumns,
      }),
      // Merge persisted liveColumns over defaults so a stored partial (or an
      // older build without this key) still ends up with every column defined.
      merge: (persisted: any, current) => ({
        ...current,
        ...(persisted ?? {}),
        liveColumns: { ...DEFAULT_LIVE_COLUMNS, ...(persisted?.liveColumns ?? {}) },
      }),
    }
  )
);
