import AsyncStorage from "@react-native-async-storage/async-storage";

const { create } = require("zustand") as typeof import("zustand");
const { createJSONStorage, persist } = require("zustand/middleware") as typeof import("zustand/middleware");

export type ThemeMode = "dark" | "light";
export type ScalePreset = "small" | "normal" | "large";
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
      scale: "normal",
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
      storage: createJSONStorage(() => AsyncStorage),
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
