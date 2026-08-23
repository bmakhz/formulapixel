import type { CSSProperties } from "react";

// Mirrors React Native's `style={[a, b, c]}` merge pattern for web inline
// styles, so ported components keep the same call shape.
export function sx(...styles: Array<CSSProperties | false | null | undefined>): CSSProperties {
  return Object.assign({}, ...styles.filter(Boolean));
}
