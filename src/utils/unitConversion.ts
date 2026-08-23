import type { SpeedUnit, TemperatureUnit } from "../store/useSettingsStore";

export function toFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

export function toMph(kmh: number): number {
  return kmh * 0.621371;
}

export function formatTemperature(value: number | null | undefined, unit: TemperatureUnit): string {
  if (value == null || Number.isNaN(value)) return "--";
  const display = unit === "F" ? toFahrenheit(value) : value;
  return `${Math.round(display)}${unit === "F" ? "°F" : "°C"}`;
}

export function formatSpeed(value: number | null | undefined, unit: SpeedUnit): string {
  if (value == null || Number.isNaN(value)) return "--";
  const display = unit === "mph" ? toMph(value) : value;
  return `${Math.round(display)}${unit === "mph" ? "mph" : "km/h"}`;
}
