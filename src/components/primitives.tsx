import React, { type CSSProperties, type ReactNode } from "react";
import { sx } from "../utils/sx";

// ── RN-shaped primitives backed by plain HTML/CSS ──────────────────
// These exist so the screens ported from f1-live's React Native code keep
// the same component shapes (View/Text/Image/...) and the same
// style={[a, b]} merge pattern, instead of rewriting every screen's JSX
// structure from scratch.

// StyleSheet.create is a no-op on web — kept only so ported files that still
// call `StyleSheet.create({...})` don't need every call site touched.
export const StyleSheet = {
  create: <T extends Record<string, CSSProperties>>(styles: T): T => styles,
};

type ViewProps = {
  style?: CSSProperties | (CSSProperties | false | null | undefined)[];
  children?: ReactNode;
  onClick?: () => void;
};

function resolveStyle(style?: ViewProps["style"]): CSSProperties {
  if (!style) return {};
  return Array.isArray(style) ? sx(...style) : style;
}

export function View({ style, children, onClick }: ViewProps) {
  return (
    <div onClick={onClick} style={sx({ display: "flex", flexDirection: "column", boxSizing: "border-box" }, resolveStyle(style))}>
      {children}
    </div>
  );
}

type TextProps = ViewProps & { numberOfLines?: number };

export function Text({ style, children, numberOfLines }: TextProps) {
  const truncate: CSSProperties =
    numberOfLines === 1
      ? { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }
      : numberOfLines && numberOfLines > 1
        ? {
            display: "-webkit-box",
            WebkitLineClamp: numberOfLines,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }
        : { display: "block" };
  return <span style={sx(truncate, resolveStyle(style))}>{children}</span>;
}

type ImageProps = {
  source: string | null | undefined;
  style?: CSSProperties;
  resizeMode?: "contain" | "cover" | "stretch";
  alt?: string;
};

export function Image({ source, style, resizeMode = "contain", alt = "" }: ImageProps) {
  if (!source) return null;
  const objectFit: CSSProperties["objectFit"] = resizeMode === "stretch" ? "fill" : resizeMode;
  return <img src={source} alt={alt} style={sx({ objectFit }, style)} draggable={false} />;
}

type TouchableProps = ViewProps & { activeOpacity?: number; disabled?: boolean };

export function TouchableOpacity({ style, children, onClick, activeOpacity = 0.75, disabled }: TouchableProps) {
  const [pressed, setPressed] = React.useState(false);
  return (
    <div
      onClick={disabled ? undefined : onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={sx(
        { display: "flex", flexDirection: "column", boxSizing: "border-box", cursor: disabled ? "default" : "pointer" },
        resolveStyle(style),
        pressed ? { opacity: activeOpacity } : null,
        disabled ? { opacity: 0.5, pointerEvents: "none" } : null,
      )}
    >
      {children}
    </div>
  );
}

export function ScrollView({
  style,
  contentContainerStyle,
  children,
  horizontal,
}: ViewProps & { contentContainerStyle?: CSSProperties; horizontal?: boolean }) {
  return (
    <div
      style={sx(
        { overflow: "auto", display: "flex", flexDirection: horizontal ? "row" : "column", WebkitOverflowScrolling: "touch" },
        resolveStyle(style),
      )}
    >
      <div style={sx({ display: "flex", flexDirection: horizontal ? "row" : "column", width: "100%" }, contentContainerStyle)}>
        {children}
      </div>
    </div>
  );
}

type FlatListProps<T> = {
  data: T[];
  renderItem: (info: { item: T; index: number }) => ReactNode;
  keyExtractor: (item: T, index: number) => string;
  ItemSeparatorComponent?: () => ReactNode;
  contentContainerStyle?: CSSProperties;
  style?: CSSProperties;
  horizontal?: boolean;
};

// No virtualization: list sizes here (≤~25 items) don't need it, and it
// keeps this port dependency-free.
export function FlatList<T>({
  data,
  renderItem,
  keyExtractor,
  ItemSeparatorComponent,
  contentContainerStyle,
  style,
  horizontal,
}: FlatListProps<T>) {
  return (
    <div style={sx({ overflow: "auto", display: "flex", flexDirection: horizontal ? "row" : "column", flex: 1 }, style)}>
      <div style={sx({ display: "flex", flexDirection: horizontal ? "row" : "column" }, contentContainerStyle)}>
        {data.map((item, index) => (
          <React.Fragment key={keyExtractor(item, index)}>
            {index > 0 && ItemSeparatorComponent && <ItemSeparatorComponent />}
            {renderItem({ item, index })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// Safe-area padding for notched phones once installed as a PWA.
export function SafeAreaView({ style, children, edges }: ViewProps & { edges?: ("top" | "bottom" | "left" | "right")[] }) {
  const pad: CSSProperties = {};
  if (edges?.includes("top")) pad.paddingTop = "env(safe-area-inset-top)";
  if (edges?.includes("bottom")) pad.paddingBottom = "env(safe-area-inset-bottom)";
  if (edges?.includes("left")) pad.paddingLeft = "env(safe-area-inset-left)";
  if (edges?.includes("right")) pad.paddingRight = "env(safe-area-inset-right)";
  return (
    <div style={sx({ display: "flex", flexDirection: "column", boxSizing: "border-box" }, pad, resolveStyle(style))}>
      {children}
    </div>
  );
}

// No-op on native meaning; syncs the browser chrome color on web instead.
export function StatusBar({ backgroundColor }: { barStyle?: string; backgroundColor?: string }) {
  React.useEffect(() => {
    if (!backgroundColor) return;
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", backgroundColor);
  }, [backgroundColor]);
  return null;
}
