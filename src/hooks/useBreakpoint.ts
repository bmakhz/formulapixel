import { useEffect, useState } from "react";

// Single breakpoint for now: below this, treat as the mobile/phone layout
// (matches the app's native mobile-first design); at/above, desktop.
const DESKTOP_QUERY = "(min-width: 900px)";

// Shared with App.tsx's app-shell frame so the content column and the tab
// bar underneath it always cap/center at the exact same width — otherwise
// the footer spans edge-to-edge while the page content sits inset, which
// reads as broken rather than as a deliberate centered "app card".
export const DESKTOP_CONTENT_MAX_WIDTH = 960;

export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia(DESKTOP_QUERY).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return isDesktop;
}
