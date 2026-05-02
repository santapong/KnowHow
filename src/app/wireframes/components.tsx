"use client";

import { CSSProperties, ReactNode } from "react";

export const W = {
  ink: "var(--wf-ink)",
  ink2: "var(--wf-ink-2)",
  ink3: "var(--wf-ink-3)",
  paper: "var(--wf-paper)",
  fill: "var(--wf-fill)",
  bar: "var(--wf-bar)",
  accent: "var(--wf-accent)",
  hand: 'var(--wf-font-hand), "Architects Daughter", "Kalam", cursive',
  display:
    'var(--wf-font-display), "Caveat", "Architects Daughter", cursive',
  mono: 'var(--wf-font-mono), "IBM Plex Mono", ui-monospace, Menlo, monospace',
};

type Px = number | string;

export function Box({
  w,
  h,
  children,
  style,
  dashed,
  filled,
  rounded = 6,
}: {
  w?: Px;
  h?: Px;
  children?: ReactNode;
  style?: CSSProperties;
  dashed?: boolean;
  filled?: boolean;
  rounded?: number;
}) {
  return (
    <div
      style={{
        width: w,
        height: h,
        border: `1.5px ${dashed ? "dashed" : "solid"} ${W.ink}`,
        borderRadius: rounded,
        background: filled ? W.fill : "transparent",
        position: "relative",
        boxSizing: "border-box",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Scribble({
  lines = 3,
  w = "60%",
  gap = 8,
  color,
}: {
  lines?: number;
  w?: Px;
  gap?: number;
  color?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 4,
            width: i === lines - 1 ? `calc(${w} - 18%)` : w,
            background: color || W.ink3,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}

export function Hand({
  children,
  size = 18,
  italic,
  color,
  style,
}: {
  children: ReactNode;
  size?: number;
  italic?: boolean;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        fontFamily: W.hand,
        fontSize: size,
        fontStyle: italic ? "italic" : "normal",
        color: color || W.ink,
        lineHeight: 1.2,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export function Display({
  children,
  size = 32,
  color,
  style,
}: {
  children: ReactNode;
  size?: number;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        fontFamily: W.display,
        fontSize: size,
        fontWeight: 600,
        color: color || W.ink,
        lineHeight: 1.0,
        letterSpacing: "-0.01em",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export function Mono({
  children,
  size = 11,
  color,
  style,
}: {
  children: ReactNode;
  size?: number;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        fontFamily: W.mono,
        fontSize: size,
        color: color || W.ink2,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export function Squiggle({
  width = "100%",
  color,
  height = 6,
}: {
  width?: Px;
  color?: string;
  height?: number;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 6"
      preserveAspectRatio="none"
      style={{ display: "block" }}
    >
      <path
        d="M0 3 Q 5 1, 10 3 T 20 3 T 30 3 T 40 3 T 50 3 T 60 3 T 70 3 T 80 3 T 90 3 T 100 3"
        stroke={color || W.ink}
        strokeWidth="1.2"
        fill="none"
      />
    </svg>
  );
}

export function Spine({
  h = 130,
  w = 28,
  title,
  color,
  lean = 0,
}: {
  h?: number;
  w?: number;
  title?: ReactNode;
  color?: string;
  lean?: number;
}) {
  return (
    <div
      style={{
        width: w,
        height: h,
        background: color || W.fill,
        border: `1.5px solid ${W.ink}`,
        borderRadius: "2px 2px 1px 1px",
        transform: `rotate(${lean}deg)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          transform: "rotate(-90deg)",
          whiteSpace: "nowrap",
          fontFamily: W.hand,
          fontSize: 11,
          color: W.ink,
          letterSpacing: "0.02em",
        }}
      >
        {title}
      </div>
      <div
        style={{
          position: "absolute",
          left: 2,
          right: 2,
          top: "18%",
          height: 1,
          background: W.ink3,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 2,
          right: 2,
          bottom: "18%",
          height: 1,
          background: W.ink3,
        }}
      />
    </div>
  );
}

export function Cover({
  w = 90,
  h = 130,
  title,
  author,
  color,
}: {
  w?: number;
  h?: number;
  title?: ReactNode;
  author?: ReactNode;
  color?: string;
}) {
  return (
    <div
      style={{
        width: w,
        height: h,
        background: color || W.fill,
        border: `1.5px solid ${W.ink}`,
        borderRadius: 3,
        padding: 8,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        flexShrink: 0,
        position: "relative",
        boxShadow: `2px 2px 0 ${W.ink3}`,
      }}
    >
      <div
        style={{
          fontFamily: W.display,
          fontSize: 13,
          lineHeight: 1.05,
          color: W.ink,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: W.hand,
          fontSize: 9,
          color: W.ink2,
          fontStyle: "italic",
        }}
      >
        {author}
      </div>
    </div>
  );
}

export function Note({
  x,
  y,
  children,
  dx = 40,
  dy = 30,
  side = "right",
}: {
  x: number;
  y: number;
  children: ReactNode;
  dx?: number;
  dy?: number;
  side?: "left" | "right";
}) {
  const tip = { left: x, top: y };
  const cap = {
    left: side === "right" ? x + dx : x - dx - 130,
    top: y + dy,
    width: 130,
  };
  const minLeft = Math.min(tip.left, cap.left + 60);
  const minTop = Math.min(tip.top, cap.top);
  return (
    <>
      <svg
        style={{
          position: "absolute",
          left: minLeft - 10,
          top: minTop - 10,
          width: Math.abs(dx) + 80,
          height: Math.abs(dy) + 40,
          pointerEvents: "none",
          overflow: "visible",
        }}
      >
        <path
          d={`M ${10 + (cap.left - minLeft)} ${10 + (cap.top - minTop)} Q ${
            10 + (tip.left - minLeft) - 10
          } ${10 + (cap.top - minTop) - 10}, ${10 + (tip.left - minLeft)} ${
            10 + (tip.top - minTop)
          }`}
          stroke={W.ink2}
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
        />
        <circle
          cx={10 + (tip.left - minLeft)}
          cy={10 + (tip.top - minTop)}
          r="2"
          fill={W.ink2}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: cap.left,
          top: cap.top,
          width: cap.width,
          fontFamily: W.hand,
          fontSize: 12,
          color: W.ink2,
          fontStyle: "italic",
          lineHeight: 1.25,
        }}
      >
        {children}
      </div>
    </>
  );
}

export function Pill({
  children,
  filled,
  style,
}: {
  children: ReactNode;
  filled?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 10px",
        border: `1.2px solid ${W.ink}`,
        borderRadius: 999,
        background: filled ? W.accent : "transparent",
        color: filled ? W.paper : W.ink,
        fontFamily: W.hand,
        fontSize: 12,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Btn({
  children,
  primary,
  w,
  style,
}: {
  children: ReactNode;
  primary?: boolean;
  w?: Px;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "8px 16px",
        width: w,
        border: `1.5px solid ${W.ink}`,
        borderRadius: 4,
        background: primary ? W.ink : "transparent",
        color: primary ? W.paper : W.ink,
        fontFamily: W.hand,
        fontSize: 14,
        boxShadow: primary ? `2px 2px 0 ${W.accent}` : `2px 2px 0 ${W.ink3}`,
        cursor: "pointer",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Frame({
  children,
  w = 1100,
  h = 720,
  style,
}: {
  children: ReactNode;
  w?: number;
  h?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      className="wf-root"
      style={{
        width: w,
        height: h,
        background: W.paper,
        position: "relative",
        overflow: "hidden",
        backgroundImage:
          "radial-gradient(rgba(0,0,0,0.025) 1px, transparent 1px)",
        backgroundSize: "4px 4px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function AppBar({
  active = "shelf",
}: {
  active?: "shelf" | "upload" | "community" | "settings";
}) {
  const items: Array<"shelf" | "upload" | "community" | "settings"> = [
    "shelf",
    "upload",
    "community",
    "settings",
  ];
  return (
    <div
      style={{
        height: 56,
        borderBottom: `1.5px solid ${W.ink}`,
        display: "flex",
        alignItems: "center",
        padding: "0 28px",
        gap: 28,
        background: W.bar,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Box w={22} h={28} filled rounded={2} />
        <Display size={20}>KnowHow</Display>
      </div>
      <div style={{ flex: 1 }} />
      {items.map((it) => (
        <div key={it} style={{ position: "relative" }}>
          <Hand size={14} color={active === it ? W.ink : W.ink2}>
            {it}
          </Hand>
          {active === it && (
            <div
              style={{
                position: "absolute",
                bottom: -18,
                left: -4,
                right: -4,
                height: 4,
              }}
            >
              <Squiggle color={W.accent} />
            </div>
          )}
        </div>
      ))}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: `1.2px solid ${W.ink}`,
          marginLeft: 12,
        }}
      />
    </div>
  );
}
