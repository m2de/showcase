import React from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Same palette as the Ceefax homepage on marcomark.co.uk, so every video reads as part of the site.
export const C = {
  black: "#000000",
  red: "#ff0000",
  green: "#00ff00",
  yellow: "#ffff00",
  blue: "#0000ff",
  magenta: "#ff00ff",
  cyan: "#00ffff",
  white: "#ffffff",
  dim: "#888888",
};

export const FONT = "'IBM Plex Mono', monospace";

const fontHandle = delayRender("Loading IBM Plex Mono");
Promise.all(
  [400, 700].map((weight) =>
    new FontFace("IBM Plex Mono", `url(${staticFile(`fonts/ibm-plex-mono-latin-${weight}-normal.woff2`)})`, {
      weight: String(weight),
    })
      .load()
      .then((f) => document.fonts.add(f)),
  ),
).then(() => continueRender(fontHandle));

// A "unit" scales with the shorter side so the same scene works in 9:16 and 16:9.
export const useUnit = () => {
  const { width, height } = useVideoConfig();
  // Phones have height to spare, so vertical text runs a little larger.
  return (Math.min(width, height) / 100) * (height > width ? 1.2 : 1);
};

export const useIsVertical = () => {
  const { width, height } = useVideoConfig();
  return height > width;
};

const Scanlines: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 2px, transparent 2px, transparent 5px)",
      mixBlendMode: "multiply",
    }}
  />
);

const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.65) 100%)",
    }}
  />
);

// The page header row, with a clock that ticks along with the video.
export const HeaderRow: React.FC<{ page: string; clockStart?: number }> = ({ page, clockStart = 9 * 3600 + 47 * 60 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const u = useUnit();
  const t = clockStart + Math.floor(frame / fps);
  const hh = String(Math.floor(t / 3600) % 24).padStart(2, "0");
  const mm = String(Math.floor(t / 60) % 60).padStart(2, "0");
  const ss = String(t % 60).padStart(2, "0");
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontFamily: FONT,
        fontSize: 3.6 * u,
        color: C.white,
        padding: `${2.5 * u}px ${4 * u}px`,
      }}
    >
      <span>
        <span style={{ color: C.white }}>{page}</span>
        <span style={{ color: C.yellow, marginLeft: 2 * u }}>MARCOMARK</span>
      </span>
      <span style={{ color: C.yellow }}>
        {hh}:{mm}/{ss}
      </span>
    </div>
  );
};

// A solid colour band, the classic teletext section banner.
export const Band: React.FC<{ bg: string; fg: string; children: React.ReactNode; size?: number }> = ({
  bg,
  fg,
  children,
  size = 4.2,
}) => {
  const u = useUnit();
  return (
    <div
      style={{
        background: bg,
        color: fg,
        fontFamily: FONT,
        fontWeight: 700,
        fontSize: size * u,
        padding: `${1.2 * u}px ${4 * u}px`,
        letterSpacing: "0.04em",
      }}
    >
      {children}
    </div>
  );
};

export const Screen: React.FC<{ page: string; children: React.ReactNode }> = ({ page, children }) => {
  const frame = useCurrentFrame();
  // A faint flicker sells the CRT without being distracting.
  const flicker = interpolate(Math.sin(frame * 1.7) + Math.sin(frame * 0.31), [-2, 2], [0.96, 1]);
  return (
    <AbsoluteFill style={{ background: C.black, fontFamily: FONT }}>
      <AbsoluteFill style={{ opacity: flicker, display: "flex", flexDirection: "column" }}>
        <HeaderRow page={page} />
        <div style={{ flex: 1, position: "relative" }}>{children}</div>
      </AbsoluteFill>
      <Scanlines />
      <Vignette />
    </AbsoluteFill>
  );
};

// Text that appears character by character, like a page filling in.
export const Typed: React.FC<{
  text: string;
  start?: number;
  cps?: number;
  style?: React.CSSProperties;
  cursor?: boolean;
}> = ({ text, start = 0, cps = 28, style, cursor = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chars = Math.max(0, Math.floor(((frame - start) / fps) * cps));
  const shown = text.slice(0, chars);
  const done = chars >= text.length;
  const blinkOn = Math.floor(frame / (fps / 2)) % 2 === 0;
  return (
    <span style={style}>
      {shown}
      {cursor && (!done || blinkOn) && frame >= start ? <span style={{ opacity: 0.9 }}>█</span> : null}
    </span>
  );
};

// Teletext pages "arrive" with a hard cut, so scenes pop in rather than fade.
export const PopIn: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  at,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  return <div style={style}>{children}</div>;
};
