import { useEffect, useRef, useState } from "react";

// CarData.z channels, per F1's SignalR feed:
//   0 = RPM, 2 = Speed (km/h), 3 = Gear (0-8), 4 = Throttle (0-100),
//   5 = Brake (0/1 or 0-100 depending on car), 45 = DRS status code.
export type CarChannels = {
  rpm: number | null;
  speed: number | null;
  gear: number | null;
  throttle: number | null; // 0-100
  brake: number | null;    // 0-100
  drs: number | null;      // raw status code, see drsLabel
};

const DRS_OPEN = new Set([10, 12, 14]);
const DRS_READY = new Set([8]);

export function drsLabel(code: number | null): string {
  if (code == null) return "--";
  if (DRS_OPEN.has(code)) return "OPEN";
  if (DRS_READY.has(code)) return "READY";
  return "CLOSED";
}

function toBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// F1's ".z" categories are raw-deflate (no zlib/gzip header) compressed,
// base64-encoded JSON. The relay forwards them verbatim, so decoding happens
// here in the browser via the native DecompressionStream API.
async function inflateCategory(raw: unknown): Promise<any | null> {
  if (raw == null) return null;
  if (typeof raw !== "string") return raw; // some relays decode server-side
  if (typeof DecompressionStream === "undefined") return null;
  try {
    const bytes = toBytes(raw);
    const stream = new Blob([bytes.buffer as ArrayBuffer]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    const buf = await new Response(stream).arrayBuffer();
    return JSON.parse(new TextDecoder().decode(buf));
  } catch {
    return null;
  }
}

function clampPct(n: number): number {
  return Math.max(0, Math.min(100, n));
}

function readChannels(entries: any, driverNumber: number): CarChannels | null {
  const list: any[] = Array.isArray(entries) ? entries : [];
  for (let i = list.length - 1; i >= 0; i--) {
    const ch = list[i]?.Cars?.[String(driverNumber)]?.Channels;
    if (!ch) continue;
    const brakeRaw = typeof ch["5"] === "number" ? ch["5"] : null;
    return {
      rpm: typeof ch["0"] === "number" ? ch["0"] : null,
      speed: typeof ch["2"] === "number" ? ch["2"] : null,
      gear: typeof ch["3"] === "number" ? ch["3"] : null,
      throttle: typeof ch["4"] === "number" ? clampPct(ch["4"]) : null,
      brake: brakeRaw == null ? null : clampPct(brakeRaw <= 1 ? brakeRaw * 100 : brakeRaw),
      drs: typeof ch["45"] === "number" ? ch["45"] : null,
    };
  }
  return null;
}

// Decodes the latest CarData batch and reads out one driver's channels.
// The decode only runs while `driverNumber` is set, so expanding a row is
// the only thing that pays the inflate cost.
export function useCarTelemetry(carDataRaw: unknown, driverNumber: number | null) {
  const [channels, setChannels] = useState<CarChannels | null>(null);
  const [loading, setLoading] = useState(false);
  const seqRef = useRef(0);

  useEffect(() => {
    if (driverNumber == null || carDataRaw == null) {
      setChannels(null);
      setLoading(false);
      return;
    }
    const mySeq = ++seqRef.current;
    setLoading(true);
    inflateCategory(carDataRaw).then((decoded) => {
      if (mySeq !== seqRef.current) return; // superseded by a newer tick/driver
      setChannels(readChannels(decoded?.Entries, driverNumber));
      setLoading(false);
    });
  }, [carDataRaw, driverNumber]);

  return { channels, loading };
}
