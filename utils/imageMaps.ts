import type { ImageSourcePropType } from "react-native";
import type { ThemeMode } from "../components/theme";

const CAR_IMAGES = {
  alpine: require("../images/cars/alpine.png"),
  astonmartin: require("../images/cars/astonmartin.png"),
  audi: require("../images/cars/audi.png"),
  cadillac: require("../images/cars/cadillac.png"),
  ferrari: require("../images/cars/ferrari.png"),
  haas: require("../images/cars/haas.png"),
  mclaren: require("../images/cars/mclaren.png"),
  mercedes: require("../images/cars/mercedes.png"),
  redbull: require("../images/cars/redbull.png"),
  visacashapprb: require("../images/cars/visacashapprb.png"),
  williams: require("../images/cars/Williams.png"),
} as const;

const LOGO_IMAGES = {
  alpine: require("../images/logos/alpine.png"),
  astonmartin: require("../images/logos/astonmartin.png"),
  audi: require("../images/logos/e4d3caef1cb74a5b93829bbc5df4c84e.png"),
  cadillac: require("../images/logos/cadillac.png"),
  ferrari: require("../images/logos/ferrari.png"),
  haas: require("../images/logos/haas.png"),
  mclaren: require("../images/logos/mclaren.png"),
  mercedes: require("../images/logos/mercedes.png"),
  redbull: require("../images/logos/redbull.png"),
  visacashapprb: require("../images/logos/visacashapprb.png"),
  williams: require("../images/logos/williams.png"),
} as const;

const TRACKS_DARK = {
  abudhabi: require("../images/tracks_darkmode/abudhabi.png"),
  australia: require("../images/tracks_darkmode/australia.png"),
  austria: require("../images/tracks_darkmode/austria.png"),
  azerbaijan: require("../images/tracks_darkmode/azerbaijan.png"),
  bahrain: require("../images/tracks_darkmode/bahrain.png"),
  belgium: require("../images/tracks_darkmode/belgium.png"),
  brazil: require("../images/tracks_darkmode/brazil.png"),
  canada: require("../images/tracks_darkmode/canada.png"),
  china: require("../images/tracks_darkmode/china.png"),
  greatbritain: require("../images/tracks_darkmode/greatbritain.png"),
  hungary: require("../images/tracks_darkmode/hungary.png"),
  italy: require("../images/tracks_darkmode/italy.png"),
  japan: require("../images/tracks_darkmode/japan.png"),
  mexico: require("../images/tracks_darkmode/mexico.png"),
  monaco: require("../images/tracks_darkmode/monaco.png"),
  netherlands: require("../images/tracks_darkmode/netherlands.png"),
  qatar: require("../images/tracks_darkmode/qatar.png"),
  saudiarabia: require("../images/tracks_darkmode/saudiarabia.png"),
  singapore: require("../images/tracks_darkmode/singapore.png"),
  "spain(barcelona)": require("../images/tracks_darkmode/spain(barcelona).png"),
  "spain(madrid)": require("../images/tracks_darkmode/spain(madrid).png"),
  "usa(austin)": require("../images/tracks_darkmode/usa(austin).png"),
  "usa(lasvegas)": require("../images/tracks_darkmode/usa(lasvegas).png"),
  "usa(miami)": require("../images/tracks_darkmode/usa(miami).png"),
} as const;

const TRACKS_LIGHT = {
  abudhabi: require("../images/tracks_lightmode/abudhabi.png"),
  australia: require("../images/tracks_lightmode/australia.png"),
  austria: require("../images/tracks_lightmode/austria.png"),
  azerbaijan: require("../images/tracks_lightmode/azerbaijan.png"),
  bahrain: require("../images/tracks_lightmode/bahrain.png"),
  belgium: require("../images/tracks_lightmode/belgium.png"),
  brazil: require("../images/tracks_lightmode/brazil.png"),
  canada: require("../images/tracks_lightmode/canada.png"),
  china: require("../images/tracks_lightmode/china.png"),
  greatbritain: require("../images/tracks_lightmode/greatbritain.png"),
  hungary: require("../images/tracks_lightmode/hungary.png"),
  italy: require("../images/tracks_lightmode/italy.png"),
  japan: require("../images/tracks_lightmode/japan.png"),
  mexico: require("../images/tracks_lightmode/mexico.png"),
  monaco: require("../images/tracks_lightmode/monaco.png"),
  netherlands: require("../images/tracks_lightmode/netherlands.png"),
  qatar: require("../images/tracks_lightmode/qatar.png"),
  saudiarabia: require("../images/tracks_lightmode/saudiarabia.png"),
  singapore: require("../images/tracks_lightmode/singapore.png"),
  "spain(barcelona)": require("../images/tracks_lightmode/spain(barcelona).png"),
  "spain(madrid)": require("../images/tracks_lightmode/spain(madrid).png"),
  "usa(austin)": require("../images/tracks_lightmode/usa(austin).png"),
  "usa(lasvegas)": require("../images/tracks_lightmode/usa(lasvegas).png"),
  "usa(miami)": require("../images/tracks_lightmode/usa(miami).png"),
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

export function teamLiverySource(team?: string): ImageSourcePropType | null {
  const key = teamKey(team);
  return key ? CAR_IMAGES[key] : null;
}

export function teamLogoSource(team?: string): ImageSourcePropType | null {
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

export function trackOutlineSource(mode: ThemeMode, country?: string, location?: string, circuit?: string): ImageSourcePropType | null {
  const key = trackKey(country, location, circuit);
  if (!key) return null;
  return mode === "light" ? TRACKS_LIGHT[key] : TRACKS_DARK[key];
}
