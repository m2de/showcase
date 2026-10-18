import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { F, P } from "./space";

// The cast and set shared by the Spaghettification series: the probe (the agent), its torch (what
// it can see), the bridge of code blocks, the starfield, captions and the end card.

export const clampOpts = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const k = (T: number, at: number[], v: number[], ease = Easing.inOut(Easing.cubic)) => interpolate(T, at, v, { ...clampOpts, easing: ease });

export const BLOCK_W = 11;


export const useView = () => {
  const { width, height } = useVideoConfig();
  const vertical = height > width;
  // Close in: the probe is the star, so the frame shows about 55 units across on a phone.
  const u = vertical ? width / 55 : height / 60;
  const bridgeY = height * (vertical ? 0.44 : 0.46);
  return { width, height, vertical, u, bridgeY, anchor: width * (vertical ? 0.2 : 0.36) };
};

export const Stars: React.FC<{ cam: number }> = ({ cam }) => {
  const { width, height, u } = useView();
  const stars = Array.from({ length: 170 }, (_, i) => {
    const depth = 0.08 + random(`d${i}`) * 0.35;
    const span = width + 400;
    const x = (((random(`x${i}`) * span - cam * u * depth) % span) + span) % span - 200;
    const y = random(`y${i}`) * height;
    const s = 1 + random(`s${i}`) * 2.6 * depth * 3;
    return <div key={i} style={{ position: "absolute", left: x, top: y, width: s, height: s, borderRadius: "50%", background: random(`c${i}`) > 0.8 ? "#ffd9b0" : "#e6dcff", opacity: 0.35 + depth * 1.6 }} />;
  });
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 40% at ${70 - cam * 0.03}% 20%, rgba(107,79,214,0.22), transparent 70%), radial-gradient(ellipse 50% 35% at ${20 - cam * 0.02}% 85%, rgba(255,107,26,0.08), transparent 70%)`,
        }}
      />
      {stars}
    </AbsoluteFill>
  );
};

export const CodeBlock: React.FC<{ x: number; y: number; lit: number; seed: number; grow?: number; typed?: number }> = ({ x, y, lit, seed, grow = 1, typed = 1 }) => {
  const { u } = useView();
  const w = BLOCK_W * u;
  const h = 7 * u;
  const lines = [0, 1, 2, 3].map((j) => ({ indent: j === 0 || j === 3 ? 0 : 1, len: 0.35 + random(`l${seed}-${j}`) * 0.5 }));
  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        borderRadius: u * 0.8,
        border: `${Math.max(1.5, u * 0.18)}px solid ${lit > 0.5 ? P.amber : "rgba(169,107,255,0.35)"}`,
        background: lit > 0.5 ? "rgba(255,157,77,0.12)" : "rgba(12,8,32,0.6)",
        boxShadow: lit > 0.5 ? `0 0 ${u * 3 * lit}px rgba(255,107,26,${0.45 * lit})` : "none",
        transform: `scale(${grow})`,
        opacity: Math.min(1, grow * 1.5),
        padding: `${u * 1.1}px ${u * 1.2}px`,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {lines.map((l, j) => (
        <div
          key={j}
          style={{
            marginLeft: l.indent * u * 1.2,
            width: `${l.len * 100 * Math.max(0, Math.min(1, typed * 4 - j))}%`,
            height: u * 0.55,
            borderRadius: u,
            background: lit > 0.5 ? (j === 0 ? P.gold : P.starlight) : "rgba(169,107,255,0.28)",
            opacity: lit > 0.5 ? 0.9 : 0.6,
          }}
        />
      ))}
    </div>
  );
};

// The agent: a little probe, travelling right, lens forward.
export const Probe: React.FC<{ x: number; y: number; frame: number; stretch?: number; fade?: number; lost?: number; facing?: number; tilt?: number }> = ({
  x,
  y,
  frame,
  stretch = 1,
  fade = 1,
  lost = 0,
  facing = 1,
  tilt = 0,
}) => {
  const { u } = useView();
  const s = u * 0.62;
  const bob = Math.sin(frame / 9) * u * 0.35 * (1 - lost);
  const flame = 0.7 + 0.3 * Math.sin(frame * 1.7) + 0.2 * Math.sin(frame * 3.1);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + bob,
        transform: `translate(-50%, -50%) rotate(${tilt}deg) scale(${stretch * facing}, ${1 / Math.pow(stretch, 0.75)})`,
        transformOrigin: stretch === 1 ? "50% 50%" : "100% 50%",
        opacity: fade,
        filter: lost > 0 ? `blur(${lost * 3}px)` : undefined,
      }}
    >
      <svg width={16 * s} height={14 * s} viewBox="-8 -7 16 14" style={{ overflow: "visible", display: "block" }}>
        <defs>
          <linearGradient id="hull" x1="0" y1="-1" x2="0" y2="1">
            <stop offset="0" stopColor="#3a2f6e" />
            <stop offset="0.5" stopColor="#1d1640" />
            <stop offset="1" stopColor="#0e0a24" />
          </linearGradient>
          <radialGradient id="lens">
            <stop offset="0" stopColor="#fff6e0" />
            <stop offset="0.45" stopColor={P.gold} />
            <stop offset="1" stopColor={P.ember} />
          </radialGradient>
        </defs>
        {/* thruster */}
        <path d={`M -6 -1.1 L ${-6 - 4 * flame} 0 L -6 1.1 Z`} fill={P.violet} opacity={0.85} />
        <path d={`M -6 -0.6 L ${-6 - 2.4 * flame} 0 L -6 0.6 Z`} fill="#f3eaff" />
        {/* solar panels */}
        <rect x={-3.2} y={-6.6} width={5.4} height={3.2} rx={0.3} fill="#2a2160" stroke={P.indigo} strokeWidth={0.25} />
        <rect x={-3.2} y={3.4} width={5.4} height={3.2} rx={0.3} fill="#2a2160" stroke={P.indigo} strokeWidth={0.25} />
        {[-1.4, 0.4].map((gx) => (
          <g key={gx}>
            <line x1={gx} y1={-6.6} x2={gx} y2={-3.4} stroke={P.indigo} strokeWidth={0.18} />
            <line x1={gx} y1={3.4} x2={gx} y2={6.6} stroke={P.indigo} strokeWidth={0.18} />
          </g>
        ))}
        <line x1={-0.4} y1={-3.4} x2={-0.4} y2={-2.4} stroke={P.dust} strokeWidth={0.4} />
        <line x1={-0.4} y1={2.4} x2={-0.4} y2={3.4} stroke={P.dust} strokeWidth={0.4} />
        {/* body */}
        <path d="M -6 -2.6 L 2.6 -2.6 L 5 -1.2 L 5 1.2 L 2.6 2.6 L -6 2.6 Z" fill="url(#hull)" stroke={P.violet} strokeWidth={0.3} />
        <line x1={-4} y1={-1.2} x2={1} y2={-1.2} stroke={P.indigo} strokeWidth={0.25} />
        <circle cx={-3.6} cy={0.6} r={0.45} fill={frame % 30 < 15 ? "#7dffb0" : "#2a5a40"} />
        {/* lens */}
        <circle cx={4.6} cy={0} r={1.7} fill="url(#lens)" />
        <circle cx={5} cy={-0.5} r={0.45} fill="#ffffff" opacity={0.9} />
      </svg>
    </div>
  );
};

export const Torch: React.FC<{ x: number; y: number; len: number; flicker: number; dir?: number; colour?: string }> = ({ x, y, len, flicker, dir = 1, colour }) => {
  const { u } = useView();
  if (len <= 0.5) return null;
  const L = len * u;
  const spread = Math.min(L * 0.22, 9 * u);
  return (
    <svg style={{ position: "absolute", left: dir > 0 ? x : x - L, top: y - spread * 1.2, overflow: "visible", opacity: flicker, transform: dir > 0 ? undefined : "scaleX(-1)" }} width={L} height={spread * 2.4}>
      <defs>
        <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={colour ?? P.gold} stopOpacity={0.55} />
          <stop offset="0.7" stopColor={P.amber} stopOpacity={0.16} />
          <stop offset="1" stopColor={P.amber} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`M 0 ${spread * 1.2 - u * 0.5} L ${L} ${spread * 0.2} L ${L} ${spread * 2.2} L 0 ${spread * 1.2 + u * 0.5} Z`} fill="url(#beam)" />
    </svg>
  );
};

// Bits of probe streaming into the hole while it's being stretched.
export const Debris: React.FC<{ fromX: number; toX: number; y: number; amount: number; frame: number }> = ({ fromX, toX, y, amount, frame }) => {
  const { u } = useView();
  if (amount <= 0) return null;
  return (
    <>
      {Array.from({ length: 14 }, (_, i) => {
        const p = (frame * 0.05 + random(`deb${i}`)) % 1;
        const x = fromX + (toX - fromX) * Math.pow(p, 1.8);
        const yy = y + (random(`dy${i}`) - 0.5) * 3 * u * (1 - p);
        return (
          <div key={i} style={{ position: "absolute", left: x, top: yy, width: u * (0.6 + 2.5 * p), height: Math.max(1, u * 0.22 * (1 - p)), background: i % 3 ? P.amber : P.violet, opacity: amount * (1 - p) }} />
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------- words

export const Caption: React.FC<{ text: string; from: number; to: number; hot?: string }> = ({ text, from, to, hot }) => {
  const frame = useCurrentFrame();
  const { vertical, height, width } = useView();
  if (frame < from || frame > to) return null;
  const a = interpolate(frame, [from, from + 8, to - 8, to], [0, 1, 1, 0], clampOpts);
  const size = vertical ? 84 : 72;
  const parts = hot ? text.split(hot) : [text];
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        width,
        top: vertical ? height * 0.66 : height * 0.74,
        textAlign: "center",
        fontFamily: F.sans,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: "-0.02em",
        lineHeight: 1.1,
        color: P.starlight,
        padding: "0 70px",
        boxSizing: "border-box",
        opacity: a,
        transform: `translateY(${(1 - a) * 18}px)`,
        filter: `blur(${(1 - a) * 8}px)`,
        textShadow: "0 0 30px rgba(5,3,10,0.95), 0 0 8px rgba(5,3,10,0.9)",
      }}
    >
      {parts[0]}
      {hot ? <span style={{ color: P.amber, textShadow: "0 0 30px rgba(255,107,26,0.6)" }}>{hot}</span> : null}
      {parts[1]}
    </div>
  );
};

export const Rewind: React.FC<{ frame: number }> = ({ frame }) => {
  const { vertical, width, height } = useView();
  return (
    <AbsoluteFill>
      {Array.from({ length: 6 }, (_, i) => {
        const y = ((random(`rw${i}`) * height + frame * 37 * (i + 1)) % height) | 0;
        return <div key={i} style={{ position: "absolute", left: 0, top: y, width, height: 3 + (i % 3) * 4, background: "rgba(236,230,255,0.12)" }} />;
      })}
      <div style={{ position: "absolute", right: vertical ? 70 : 90, top: vertical ? 104 : 64, fontFamily: F.mono, fontWeight: 600, fontSize: vertical ? 34 : 30, color: P.starlight, letterSpacing: "0.15em" }}>
        ◀◀ REWIND
      </div>
    </AbsoluteFill>
  );
};

export const EndCard: React.FC<{ from: number; line: string }> = ({ from, line }) => {
  const frame = useCurrentFrame();
  const { vertical } = useView();
  if (frame < from) return null;
  const a = interpolate(frame, [from, from + 16], [0, 1], clampOpts);
  const b = interpolate(frame, [from + 12, from + 28], [0, 1], clampOpts);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center", padding: 80 }}>
      <div
        style={{
          fontFamily: F.sans,
          fontWeight: 700,
          fontSize: vertical ? 96 : 104,
          letterSpacing: "-0.03em",
          color: P.starlight,
          opacity: a,
          transform: `scale(${1 + (1 - a) * 0.6}, ${1 - (1 - a) * 0.5})`,
          filter: `blur(${(1 - a) * 12}px)`,
          textShadow: "0 0 40px rgba(169,107,255,0.6)",
        }}
      >
        Spaghettification
      </div>
      <div style={{ fontFamily: F.sans, fontWeight: 500, fontSize: vertical ? 44 : 40, color: P.dust, marginTop: 24, opacity: b, maxWidth: 900, lineHeight: 1.25 }}>
        {line}
      </div>
      <div style={{ fontFamily: F.mono, fontSize: vertical ? 32 : 30, color: P.gold, marginTop: 44, opacity: b }}>marcomark.co.uk/blog/spaghettification</div>
    </AbsoluteFill>
  );
};
