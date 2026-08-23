import type { ThemeMode } from "../theme";

// Ported from f1-live/utils/imageMaps.ts. Native used require() to bundle
// images; on web the same PNGs live in /public/images (copied verbatim from
// f1-live/images) and are referenced as plain URL strings instead.

const CAR_IMAGES = {
  alpine: "/images/cars/alpine.png",
  astonmartin: "/images/cars/astonmartin.png",
  audi: "/images/cars/audi.png",
  cadillac: "/images/cars/cadillac.png",
  ferrari: "/images/cars/ferrari.png",
  haas: "/images/cars/haas.png",
  mclaren: "/images/cars/mclaren.png",
  mercedes: "/images/cars/mercedes.png",
  redbull: "/images/cars/redbull.png",
  visacashapprb: "/images/cars/visacashapprb.png",
  williams: "/images/cars/Williams.png",
} as const;

const LOGO_IMAGES = {
  alpine: "/images/logos/alpine.png",
  astonmartin: "/images/logos/astonmartin.png",
  audi: "/images/logos/e4d3caef1cb74a5b93829bbc5df4c84e.png",
  cadillac: "/images/logos/cadillac.png",
  ferrari: "/images/logos/ferrari.png",
  haas: "/images/logos/haas.png",
  mclaren: "/images/logos/mclaren.png",
  mercedes: "/images/logos/mercedes.png",
  redbull: "/images/logos/redbull.png",
  visacashapprb: "/images/logos/visacashapprb.png",
  williams: "/images/logos/williams.png",
} as const;

const TRACKS_DARK = {
  abudhabi: "/images/tracks_darkmode/abudhabi.png",
  australia: "/images/tracks_darkmode/australia.png",
  austria: "/images/tracks_darkmode/austria.png",
  azerbaijan: "/images/tracks_darkmode/azerbaijan.png",
  bahrain: "/images/tracks_darkmode/bahrain.png",
  belgium: "/images/tracks_darkmode/belgium.png",
  brazil: "/images/tracks_darkmode/brazil.png",
  canada: "/images/tracks_darkmode/canada.png",
  china: "/images/tracks_darkmode/china.png",
  greatbritain: "/images/tracks_darkmode/greatbritain.png",
  hungary: "/images/tracks_darkmode/hungary.png",
  italy: "/images/tracks_darkmode/italy.png",
  japan: "/images/tracks_darkmode/japan.png",
  mexico: "/images/tracks_darkmode/mexico.png",
  monaco: "/images/tracks_darkmode/monaco.png",
  netherlands: "/images/tracks_darkmode/netherlands.png",
  qatar: "/images/tracks_darkmode/qatar.png",
  saudiarabia: "/images/tracks_darkmode/saudiarabia.png",
  singapore: "/images/tracks_darkmode/singapore.png",
  "spain(barcelona)": "/images/tracks_darkmode/spain(barcelona).png",
  "spain(madrid)": "/images/tracks_darkmode/spain(madrid).png",
  "usa(austin)": "/images/tracks_darkmode/usa(austin).png",
  "usa(lasvegas)": "/images/tracks_darkmode/usa(lasvegas).png",
  "usa(miami)": "/images/tracks_darkmode/usa(miami).png",
} as const;

const TRACKS_LIGHT = {
  abudhabi: "/images/tracks_lightmode/abudhabi.png",
  australia: "/images/tracks_lightmode/australia.png",
  austria: "/images/tracks_lightmode/austria.png",
  azerbaijan: "/images/tracks_lightmode/azerbaijan.png",
  bahrain: "/images/tracks_lightmode/bahrain.png",
  belgium: "/images/tracks_lightmode/belgium.png",
  brazil: "/images/tracks_lightmode/brazil.png",
  canada: "/images/tracks_lightmode/canada.png",
  china: "/images/tracks_lightmode/china.png",
  greatbritain: "/images/tracks_lightmode/greatbritain.png",
  hungary: "/images/tracks_lightmode/hungary.png",
  italy: "/images/tracks_lightmode/italy.png",
  japan: "/images/tracks_lightmode/japan.png",
  mexico: "/images/tracks_lightmode/mexico.png",
  monaco: "/images/tracks_lightmode/monaco.png",
  netherlands: "/images/tracks_lightmode/netherlands.png",
  qatar: "/images/tracks_lightmode/qatar.png",
  saudiarabia: "/images/tracks_lightmode/saudiarabia.png",
  singapore: "/images/tracks_lightmode/singapore.png",
  "spain(barcelona)": "/images/tracks_lightmode/spain(barcelona).png",
  "spain(madrid)": "/images/tracks_lightmode/spain(madrid).png",
  "usa(austin)": "/images/tracks_lightmode/usa(austin).png",
  "usa(lasvegas)": "/images/tracks_lightmode/usa(lasvegas).png",
  "usa(miami)": "/images/tracks_lightmode/usa(miami).png",
} as const;

function normalize(value?: string): string {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function teamKey(team?: string): keyof typeof CAR_IMAGES | null {
  const t = normalize(team);
  if (!t) return null;
  if (t.includes("redbull")) return "redbull";
  if (t.includes("ferrari")) return "ferrari";
  if (t.includes("mercedes")) return "mercedes";
  if (t.includes("mclaren")) return "mclaren";
  if (t.includes("astonmartin")) return "astonmartin";
  if (t.includes("alpine")) return "alpine";
  if (t.includes("haas")) return "haas";
  if (t.includes("williams")) return "williams";
  if (t.includes("visa") || t.includes("rb") || t.includes("racingbulls")) return "visacashapprb";
  if (t.includes("audi") || t.includes("sauber")) return "audi";
  if (t.includes("cadillac")) return "cadillac";
  return null;
}

export function teamLiverySource(team?: string): string | null {
  const key = teamKey(team);
  return key ? CAR_IMAGES[key] : null;
}

export function teamLogoSource(team?: string): string | null {
  const key = teamKey(team);
  return key ? LOGO_IMAGES[key] : null;
}

function trackKey(country?: string, location?: string, circuit?: string): keyof typeof TRACKS_DARK | null {
  const c = normalize(country);
  const l = normalize(location);
  const ci = normalize(circuit);

  if (c === "spain") {
    if (l.includes("madrid") || ci.includes("madrid")) return "spain(madrid)";
    return "spain(barcelona)";
  }

  if (c === "unitedstates" || c === "usa") {
    if (l.includes("miami") || ci.includes("miami")) return "usa(miami)";
    if (l.includes("vegas") || ci.includes("vegas")) return "usa(lasvegas)";
    return "usa(austin)";
  }

  if (c === "unitedkingdom") return "greatbritain";
  if (c === "saudiarabia") return "saudiarabia";
  if (c === "abudhabi" || l.includes("yasmarina")) return "abudhabi";

  const direct = c as keyof typeof TRACKS_DARK;
  if (TRACKS_DARK[direct]) return direct;
  return null;
}

export function trackOutlineSource(mode: ThemeMode, country?: string, location?: string, circuit?: string): string | null {
  const key = trackKey(country, location, circuit);
  if (!key) return null;
  return mode === "light" ? TRACKS_LIGHT[key] : TRACKS_DARK[key];
}
