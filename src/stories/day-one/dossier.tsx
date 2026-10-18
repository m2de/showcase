import React from "react";
import {
  AbsoluteFill,
  Audio,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// The look of the blog post itself: an army induction form (AR-1) on an olive desk.
// Palette and type are lifted from marcomark.co.uk/blog/every-session-is-day-one.html.

export const P = {
  olive: "#4a5240",
  oliveDeep: "#3a4032",
  buff: "#e9dec6",
  buffBright: "#f2e9d4",
  buffDark: "#d9cba9",
  ink: "#1e1a14",
  red: "#b03a2e",
  carbon: "#2f4a7a",
  khaki: "#8a7a5c",
  khakiText: "#63563e",
};

export const F = {
  stencil: "'Stardos Stencil', Impact, sans-serif",
  mono: "'IBM Plex Mono', monospace",
  serif: "'Source Serif 4', Georgia, serif",
  biro: "'Caveat', cursive",
};

const FONTS: [string, string, string, string?][] = [
  ["Stardos Stencil", "stardos-stencil/stardos-stencil-latin-400-normal.woff2", "400"],
  ["Stardos Stencil", "stardos-stencil/stardos-stencil-latin-700-normal.woff2", "700"],
  ["IBM Plex Mono", "ibm-plex-mono/ibm-plex-mono-latin-400-normal.woff2", "400"],
  ["IBM Plex Mono", "ibm-plex-mono/ibm-plex-mono-latin-700-normal.woff2", "700"],
  ["Source Serif 4", "source-serif-4/source-serif-4-latin-400-normal.woff2", "400"],
  ["Source Serif 4", "source-serif-4/source-serif-4-latin-600-normal.woff2", "600"],
  ["Source Serif 4", "source-serif-4/source-serif-4-latin-400-italic.woff2", "400", "italic"],
  ["Source Serif 4", "source-serif-4/source-serif-4-latin-600-italic.woff2", "600", "italic"],
  ["Caveat", "caveat/caveat-latin-600-normal.woff2", "600"],
  ["Caveat", "caveat/caveat-latin-700-normal.woff2", "700"],
];

const fontHandle = delayRender("Loading dossier fonts");
Promise.all(
  FONTS.map(([family, file, weight, style]) =>
    new FontFace(family, `url(${staticFile(`fonts/${file}`)})`, { weight, style: style ?? "normal" })
      .load()
      .then((f) => document.fonts.add(f)),
  ),
).then(() => continueRender(fontHandle));

// ---------- sound ----------

export const Sfx: React.FC<{ at: number; name: string; volume?: number; dur?: number }> = ({
  at,
  name,
  volume = 1,
  dur,
}) => (
  <Sequence from={at} durationInFrames={dur ?? 90} layout="none">
    <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
  </Sequence>
);

// ---------- the desk ----------

export const Desk: React.FC = () => {
  const frame = useCurrentFrame();
  // The lamp light drifts very slightly so the frame never looks frozen.
  const lx = 50 + Math.sin(frame / 90) * 4;
  const ly = 38 + Math.cos(frame / 120) * 3;
  return (
    <AbsoluteFill
      style={{
        backgroundColor: P.olive,
        backgroundImage: `radial-gradient(ellipse 70% 60% at ${lx}% ${ly}%, rgba(255,240,200,0.16), transparent 70%),
          repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0 1px, transparent 1px 3px),
          repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 3px)`,
      }}
    >
      <Grain opacity={0.22} seed={frame % 6} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.55) 100%)" }} />
    </AbsoluteFill>
  );
};

// Fractal noise, used for paper fibre and for film grain.
export const Grain: React.FC<{ opacity: number; seed?: number; freq?: number; blend?: React.CSSProperties["mixBlendMode"] }> = ({
  opacity,
  seed = 1,
  freq = 0.85,
  blend = "multiply",
}) => {
  const id = `grain-${seed}-${String(freq).replace(".", "")}`;
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity, mixBlendMode: blend, pointerEvents: "none" }}>
      <filter id={id}>
        <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves={3} seed={seed} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
};

// ---------- paper ----------

export const SHEET_W = 1000;
export const SHEET_H = 1340;

export const Sheet: React.FC<{
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  rotate?: number;
  children?: React.ReactNode;
  seed?: number;
  hole?: boolean;
  shadow?: number;
}> = ({ x = 0, y = 0, w = SHEET_W, h = SHEET_H, rotate = 0, children, seed = 3, hole = true, shadow = 1 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      transform: `rotate(${rotate}deg)`,
      background: `linear-gradient(165deg, ${P.buffBright} 0%, ${P.buff} 50%, ${P.buffDark} 100%)`,
      boxShadow: `0 ${40 * shadow}px ${80 * shadow}px rgba(0,0,0,${0.45 * shadow}), 0 ${6 * shadow}px ${14 * shadow}px rgba(0,0,0,${0.35 * shadow})`,
      overflow: "hidden",
      color: P.ink,
    }}
  >
    <Grain opacity={0.2} seed={seed} />
    {/* Age stains and a faint fold, so no two sheets look printed yesterday. */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(circle at ${20 + (seed * 37) % 60}% ${15 + (seed * 53) % 70}%, rgba(150,110,50,0.12), transparent 22%),
          radial-gradient(circle at ${70 - (seed * 29) % 40}% ${80 - (seed * 17) % 50}%, rgba(120,90,40,0.09), transparent 18%),
          linear-gradient(180deg, transparent 49.7%, rgba(0,0,0,0.06) 50%, rgba(255,255,255,0.18) 50.3%, transparent 51%)`,
        mixBlendMode: "multiply",
      }}
    />
    {hole ? (
      <div
        style={{
          position: "absolute",
          left: w * 0.035,
          top: h * 0.08,
          width: 26,
          height: 26,
          borderRadius: 13,
          background: P.oliveDeep,
          boxShadow: "inset 0 3px 4px rgba(0,0,0,0.6)",
        }}
      />
    ) : null}
    <div style={{ position: "absolute", inset: 0 }}>{children}</div>
  </div>
);

// A sheet that arrives on the desk: slides in from a direction and settles with a little spin.
export const useArrival = (at: number, from: "below" | "right" | "above" = "right", settle = -1.2) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at, fps, config: { damping: 18, mass: 0.9, stiffness: 90 } });
  const d = 1 - s;
  const dx = from === "right" ? 1700 * d : 0;
  const dy = from === "below" ? 1900 * d : from === "above" ? -1900 * d : 0;
  return { dx, dy, rotate: settle + d * (from === "right" ? 9 : -7), progress: s };
};

// And leaves: whipped off to the left.
export const useExit = (at: number) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [at, at + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  return { dx: -2200 * t, rotate: -8 * t };
};

// ---------- camera ----------

export type Rect = { x: number; y: number; w: number; h: number };
export type Shot = { at: number; rect: Rect; dur?: number };

// Frames a rectangle of the world, easing between shots. Works in any aspect ratio,
// so the same scene is a close-up on a phone and a wider shot on desktop.
export const useCamera = (shots: Shot[], margin?: number) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  let rect = shots[0].rect;
  for (let i = 1; i < shots.length; i++) {
    const s = shots[i];
    const dur = s.dur ?? 24;
    if (frame < s.at) break;
    const t = interpolate(frame, [s.at, s.at + dur], [0, 1], {
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    });
    const prev = rect;
    rect = {
      x: prev.x + (s.rect.x - prev.x) * t,
      y: prev.y + (s.rect.y - prev.y) * t,
      w: prev.w + (s.rect.w - prev.w) * t,
      h: prev.h + (s.rect.h - prev.h) * t,
    };
  }
  const top = BANNER_H(width, height);
  const availH = height - top * 2;
  // On a phone the sheet is allowed to bleed off the sides, so text reads bigger.
  const m = margin ?? (height > width ? 1.04 : 0.9);
  const scale = Math.min((width * m) / rect.w, (availH * m) / rect.h);
  // A slow handheld drift.
  const driftX = Math.sin(frame / 37) * 3 + Math.sin(frame / 13) * 1.2;
  const driftY = Math.cos(frame / 41) * 3 + Math.cos(frame / 17) * 1.2;
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  return `translate(${width / 2 + driftX}px, ${top + availH / 2 + driftY}px) scale(${scale}) translate(${-cx}px, ${-cy}px)`;
};

// Impact shake, decaying after each hit.
export const useShake = (hits: number[], strength = 22) => {
  const frame = useCurrentFrame();
  let x = 0;
  let y = 0;
  for (const h of hits) {
    const t = frame - h;
    if (t < 0 || t > 14) continue;
    const amp = strength * Math.exp(-t / 3.5);
    x += Math.sin(t * 2.9 + h) * amp;
    y += Math.cos(t * 3.7 + h) * amp;
  }
  return `translate(${x}px, ${y}px)`;
};

export const World: React.FC<{ shots: Shot[]; hits?: number[]; children: React.ReactNode; margin?: number }> = ({
  shots,
  hits = [],
  children,
  margin,
}) => {
  const cam = useCamera(shots, margin);
  const shake = useShake(hits);
  return (
    <AbsoluteFill style={{ transform: shake }}>
      <div style={{ position: "absolute", left: 0, top: 0, transform: cam, transformOrigin: "0 0" }}>{children}</div>
    </AbsoluteFill>
  );
};

// ---------- the classification banner ----------

export const BANNER_H = (width: number, height: number) => Math.round(Math.min(width, height) * 0.06);

export const Banner: React.FC<{ position: "top" | "bottom"; text: string }> = ({ position, text }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const h = BANNER_H(width, height);
  const slide = interpolate(frame, [0, 14], [-h, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const offset = (frame * 1.4) % (h * 2);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        [position]: slide,
        height: h,
        backgroundImage: `repeating-linear-gradient(-45deg, ${P.oliveDeep} 0 ${h * 0.45}px, ${P.buff} ${h * 0.45}px ${h * 0.9}px)`,
        backgroundPosition: `${offset}px 0`,
        borderTop: `3px solid ${P.ink}`,
        borderBottom: `3px solid ${P.ink}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
      }}
    >
      <span
        style={{
          background: P.buff,
          color: P.ink,
          border: `3px solid ${P.ink}`,
          fontFamily: F.mono,
          fontWeight: 700,
          fontSize: h * 0.32,
          letterSpacing: "0.24em",
          padding: `${h * 0.06}px ${h * 0.4}px`,
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
    </div>
  );
};

// ---------- ink ----------

export const Stamp: React.FC<{
  text: string;
  at: number;
  x: number;
  y: number;
  size?: number;
  rotate?: number;
  sound?: boolean;
}> = ({ text, at, x, y, size = 60, rotate = -10, sound = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at - 3) return null;
  const s = spring({ frame: frame - at + 3, fps, config: { damping: 11, stiffness: 260, mass: 0.6 } });
  const scale = interpolate(s, [0, 1], [2.6, 1]);
  const opacity = interpolate(frame - at, [-3, 0], [0, 0.85], { extrapolateRight: "clamp" });
  return (
    <>
      {sound ? <Sfx at={at} name="stamp" /> : null}
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${scale})`,
          fontFamily: F.stencil,
          fontWeight: 700,
          fontSize: size,
          textTransform: "uppercase",
          color: P.red,
          border: `${size * 0.1}px double ${P.red}`,
          borderRadius: size * 0.12,
          padding: `${size * 0.18}px ${size * 0.55}px`,
          letterSpacing: "0.1em",
          lineHeight: 1.1,
          whiteSpace: "nowrap",
          mixBlendMode: "multiply",
          opacity,
          WebkitMaskImage: "radial-gradient(ellipse 120% 120% at 42% 55%, black 50%, rgba(0,0,0,0.6) 100%)",
          zIndex: 5,
        }}
      >
        {text}
      </div>
    </>
  );
};

// A biro tick drawn in one stroke.
export const Tick: React.FC<{ at: number; x: number; y: number; size?: number; sound?: boolean }> = ({
  at,
  x,
  y,
  size = 60,
  sound = true,
}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [at, at + 7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (frame < at) return null;
  return (
    <>
      {sound ? <Sfx at={at} name="biro" volume={0.8} /> : null}
      <svg style={{ position: "absolute", left: x, top: y, overflow: "visible" }} width={size} height={size} viewBox="0 0 60 60">
        <path
          d="M4 32 C 12 38, 16 46, 22 54 C 30 34, 42 16, 58 2"
          fill="none"
          stroke={P.carbon}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - t}
        />
      </svg>
    </>
  );
};

// A biro cross, two strokes.
export const Cross: React.FC<{ at: number; x: number; y: number; size?: number }> = ({ at, x, y, size = 60 }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const a = interpolate(frame, [at, at + 3], [0, 1], { extrapolateRight: "clamp" });
  const b = interpolate(frame, [at + 3, at + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const stroke = { fill: "none", stroke: P.carbon, strokeWidth: 5, strokeLinecap: "round" as const, pathLength: 1, strokeDasharray: 1 };
  return (
    <svg style={{ position: "absolute", left: x, top: y, overflow: "visible" }} width={size} height={size} viewBox="0 0 60 60">
      <path d="M6 8 C 22 24, 38 40, 54 54" {...stroke} strokeDashoffset={1 - a} />
      <path d="M52 6 C 36 22, 22 38, 8 56" {...stroke} strokeDashoffset={1 - b} />
    </svg>
  );
};

// A hand-drawn line through or under something.
export const Scribble: React.FC<{ at: number; x: number; y: number; w: number; dur?: number; width?: number; wavy?: boolean }> = ({
  at,
  x,
  y,
  w,
  dur = 8,
  width = 5,
  wavy = false,
}) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const t = interpolate(frame, [at, at + dur], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
  const d = wavy
    ? `M0 6 ${Array.from({ length: 12 }, (_, i) => `Q ${(i + 0.5) * (w / 12)} ${i % 2 ? 0 : 12}, ${(i + 1) * (w / 12)} 6`).join(" ")}`
    : `M0 8 C ${w * 0.3} 2, ${w * 0.7} 12, ${w} 5`;
  return (
    <svg style={{ position: "absolute", left: x, top: y, overflow: "visible" }} width={w} height={14}>
      <path d={d} fill="none" stroke={P.carbon} strokeWidth={width} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - t} />
    </svg>
  );
};

// Handwriting, revealed left to right as if written.
export const Hand: React.FC<{ at: number; dur?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  at,
  dur = 18,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [at, at + dur], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ fontFamily: F.biro, fontWeight: 700, color: P.carbon, clipPath: `inset(-20% ${100 - t}% -20% 0)`, ...style }}>
      {children}
    </div>
  );
};

// Typewriter text. Plays the typing sound for as long as it's typing.
export const Typed: React.FC<{
  text: string;
  at: number;
  cps?: number;
  sound?: boolean;
  style?: React.CSSProperties;
}> = ({ text, at, cps = 40, sound = true, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = Math.max(0, Math.floor(((frame - at) / fps) * cps));
  const dur = Math.ceil((text.length / cps) * fps);
  return (
    <span style={style}>
      {sound ? <Sfx at={at} name="typing" dur={dur} volume={0.5} /> : null}
      <span>{text.slice(0, n)}</span>
      <span style={{ visibility: "hidden" }}>{text.slice(n)}</span>
    </span>
  );
};

export const Redaction: React.FC<{ at: number; dur?: number }> = ({ at, dur = 9 }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [at, at + dur], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (frame < at) return null;
  return (
    <>
      <Sfx at={at} name="marker" volume={0.8} />
      <div
        style={{
          position: "absolute",
          left: -10,
          top: -4,
          bottom: -4,
          width: `calc(${t}% + 20px)`,
          background: P.ink,
          borderRadius: 3,
          boxShadow: "0 0 2px rgba(0,0,0,0.5)",
        }}
      />
    </>
  );
};

// Small caps label in the form's mono face.
export const Label: React.FC<{ children: React.ReactNode; size?: number; style?: React.CSSProperties }> = ({
  children,
  size = 22,
  style,
}) => (
  <div
    style={{
      fontFamily: F.mono,
      fontWeight: 700,
      fontSize: size,
      letterSpacing: "0.3em",
      textTransform: "uppercase",
      color: P.khakiText,
      ...style,
    }}
  >
    {children}
  </div>
);

export const PartHeading: React.FC<{ section: string; part: string; x?: number; y: number; w?: number }> = ({
  section,
  part,
  x = 110,
  y,
  w = 800,
}) => (
  <div style={{ position: "absolute", left: x, top: y, width: w }}>
    <Label>{section}</Label>
    <div
      style={{
        fontFamily: F.serif,
        fontWeight: 600,
        fontSize: 50,
        textTransform: "uppercase",
        marginTop: 22,
        paddingBottom: 14,
        borderBottom: `4px solid ${P.khaki}`,
        lineHeight: 1.1,
      }}
    >
      {part}
    </div>
  </div>
);
