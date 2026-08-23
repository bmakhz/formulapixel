import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "dark" | "light";
export type ScalePreset = "small" | "medium" | "large";
export type SpeedUnit = "kmh" | "mph";
export type TemperatureUnit = "C" | "F";

export const DEFAULT_REALTIME_URL = "https://formula-pixel-realtime-latest.onrender.com";

type SettingsState = {
  mode: ThemeMode;
  scale: ScalePreset;
  speedUnit: SpeedUnit;
  temperatureUnit: TemperatureUnit;
  realtimeUrl: string;
  setMode: (mode: ThemeMode) => void;
  setScale: (scale: ScalePreset) => void;
  setSpeedUnit: (unit: SpeedUnit) => void;
  setTemperatureUnit: (unit: TemperatureUnit) => void;
  setRealtimeUrl: (url: string) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      mode: "dark",
      scale: "medium",
      speedUnit: "kmh",
      temperatureUnit: "C",
      realtimeUrl: DEFAULT_REALTIME_URL,
      setMode: (mode) => set({ mode }),
      setScale: (scale) => set({ scale }),
      setSpeedUnit: (speedUnit) => set({ speedUnit }),
      setTemperatureUnit: (temperatureUnit) => set({ temperatureUnit }),
      setRealtimeUrl: (realtimeUrl) => set({ realtimeUrl }),
    }),
    {
      name: "f1live-settings",
      // Web default storage is localStorage — no adapter needed here, unlike
      // the native app which needed AsyncStorage wired in explicitly.
      partialize: (state) => ({
        mode: state.mode,
        scale: state.scale,
        speedUnit: state.speedUnit,
        temperatureUnit: state.temperatureUnit,
        realtimeUrl: state.realtimeUrl,
      }),
    }
  )
);
