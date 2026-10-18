import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BlackHole } from "./BlackHole";
import { F, Label, P, Sfx } from "./space";

// Spaghettification 01: The Dependency Singularity.
// From marcomark.co.uk/blog/spaghettification.html: "A dependency is a black hole you invite in.
// The agent cannot see inside it ... so every package you pull in is another region of your code
// it has to take on faith." Told as a story: the agent is a probe that can only see what its torch
// lights. A package drops into its path as a hole the torch can't reach, and in it goes.

// ---------------------------------------------------------------- story time

// The clip opens on the ending (the probe being torn apart), rewinds, then plays the story.
// Everything on screen is a pure function of story time T, which is what makes the rewind free.
const OPEN = 60;
const REWIND_END = 92;
export const FAITH_FRAMES = 740;

const storyTime = (frame: number) => {
  if (frame < OPEN) return interpolate(frame, [0, OPEN], [405, 462]);
  if (frame < REWIND_END) {
    return interpolate(frame, [OPEN, REWIND_END], [462, 92], { easing: Easing.inOut(Easing.cubic) });
  }
  return frame;
};

// World units: one unit is a hundredth of the frame's short side.
const BLOCK = 14; // spacing
const BLOCK_W = 11;
const GAP = [12, 13, 14]; // where the package lands
const HOLE_X = 13 * BLOCK + BLOCK_W / 2;
const BLOCKS = 34;

const clampOpts = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const k = (T: number, at: number[], v: number[], ease = Easing.inOut(Easing.cubic)) => interpolate(T, at, v, { ...clampOpts, easing: ease });

const probeX = (T: number) =>
  T < 470
    ? T < 392
      ? k(T, [90, 210, 300, 330, 360, 392], [30, 128, 158, 160, 156, 160], Easing.inOut(Easing.quad))
      : k(T, [392, 470], [160, HOLE_X], Easing.in(Easing.cubic))
    : k(T, [470, 500, 580, 650], [150, 150, 152, 262]);

const camX = (T: number) => (T < 470 ? k(T, [90, 225, 265, 392, 470], [30, 128, 158, 158, 168]) : k(T, [470, 500, 575, 650], [158, 158, 158, 262]));

const holeSize = (T: number) =>
  T < 470 ? k(T, [232, 252], [0, 1], Easing.out(Easing.back(1.4))) : k(T, [470, 492], [1, 0], Easing.in(Easing.cubic));

// How far the torch reaches; it stops dead at the edge of the hole.
const reach = (T: number) => {
  const full = 34;
  const lens = probeX(T) + 4;
  if (holeSize(T) > 0.05 && lens < HOLE_X) return Math.max(0, Math.min(full, HOLE_X - 6 * holeSize(T) - lens));
  return full;
};

const litFront = (T: number) => {
  let m = 0;
  for (let t = 90; t <= T; t += 4) m = Math.max(m, probeX(t) + 4 + reach(t));
  return Math.max(m, probeX(T) + 4 + reach(T));
};

// The three blocks the agent writes for itself, after the reset.
const built = (i: number, T: number) => k(T, [505 + i * 24, 521 + i * 24], [0, 1], Easing.out(Easing.back(1.6)));

// ---------------------------------------------------------------- pieces

const useView = () => {
  const { width, height } = useVideoConfig();
  const vertical = height > width;
  // Close in: the probe is the star, so the frame shows about 55 units across on a phone.
  const u = vertical ? width / 55 : height / 60;
  const bridgeY = height * (vertical ? 0.44 : 0.46);
  return { width, height, vertical, u, bridgeY, anchor: width * (vertical ? 0.2 : 0.36) };
};

const Stars: React.FC<{ cam: number }> = ({ cam }) => {
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

const CodeBlock: React.FC<{ x: number; y: number; lit: number; seed: number; grow?: number; typed?: number }> = ({ x, y, lit, seed, grow = 1, typed = 1 }) => {
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
const Probe: React.FC<{ x: number; y: number; frame: number; stretch: number; fade: number; lost: number }> = ({ x, y, frame, stretch, fade, lost }) => {
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
        transform: `translate(-50%, -50%) scale(${stretch}, ${1 / Math.pow(stretch, 0.75)})`,
        transformOrigin: "100% 50%",
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

const Torch: React.FC<{ x: number; y: number; len: number; flicker: number }> = ({ x, y, len, flicker }) => {
  const { u } = useView();
  if (len <= 0.5) return null;
  const L = len * u;
  const spread = Math.min(L * 0.22, 9 * u);
  return (
    <svg style={{ position: "absolute", left: x, top: y - spread * 1.2, overflow: "visible", opacity: flicker }} width={L} height={spread * 2.4}>
      <defs>
        <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={P.gold} stopOpacity={0.55} />
          <stop offset="0.7" stopColor={P.amber} stopOpacity={0.16} />
          <stop offset="1" stopColor={P.amber} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`M 0 ${spread * 1.2 - u * 0.5} L ${L} ${spread * 0.2} L ${L} ${spread * 2.2} L 0 ${spread * 1.2 + u * 0.5} Z`} fill="url(#beam)" />
    </svg>
  );
};

const Crate: React.FC<{ x: number; y: number; T: number }> = ({ x, y, T }) => {
  const { u, height } = useView();
  if (T < 205 || T > 256) return null;
  const fall = k(T, [205, 232], [0, 1], Easing.in(Easing.quad));
  const crush = k(T, [234, 254], [0, 1], Easing.in(Easing.cubic));
  const top = interpolate(fall, [0, 1], [-20 * u - (y - 0), y]);
  const size = 10 * u;
  void height;
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: top - size / 2,
        width: size,
        height: size,
        transform: `rotate(${(1 - fall) * -25 + crush * 260}deg) scale(${1 - crush})`,
        border: `${u * 0.3}px solid ${P.gold}`,
        background: "linear-gradient(135deg, #3a2a14, #1c140a)",
        borderRadius: u * 0.6,
        boxShadow: `0 0 ${u * 3}px rgba(255,193,94,0.4)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: F.mono,
        fontWeight: 600,
        fontSize: u * 1.6,
        color: P.gold,
        letterSpacing: "0.05em",
      }}
    >
      <div style={{ position: "absolute", inset: u * 0.8, border: `1px dashed rgba(255,193,94,0.5)`, borderRadius: u * 0.3 }} />
      package
    </div>
  );
};

// Bits of probe streaming into the hole while it's being stretched.
const Debris: React.FC<{ fromX: number; toX: number; y: number; amount: number; frame: number }> = ({ fromX, toX, y, amount, frame }) => {
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

const Caption: React.FC<{ text: string; from: number; to: number; hot?: string }> = ({ text, from, to, hot }) => {
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

// ---------------------------------------------------------------- the clip

export const Faith: React.FC = () => {
  const frame = useCurrentFrame();
  const v = useView();
  const T = storyTime(frame);
  const cam = camX(T);
  const sx = (wx: number) => (wx - cam) * v.u + v.anchor;
  const px = probeX(T);
  const hs = holeSize(T);
  const front = litFront(T);
  const d = HOLE_X - px;
  const falling = T >= 392 && T < 470;
  const pull = falling ? k(T, [396, 462], [0, 1], Easing.in(Easing.quad)) : 0;
  const stretch = 1 + 9 * Math.pow(pull, 1.6);
  const lost = falling ? Math.max(0, Math.min(1, 1 - d / 3)) : 0;
  const respawn = T >= 470 ? k(T, [478, 500], [0, 1]) : 1;
  const hesitate = T > 300 && T < 392;
  const flicker = hesitate ? 0.6 + 0.4 * Math.abs(Math.sin(T * 0.7) * Math.sin(T * 0.23)) : 1;
  const end = interpolate(frame, [652, 670], [0, 1], clampOpts);
  const rewinding = frame >= OPEN && frame < REWIND_END;
  const holeW = 90;
  const holeH = 46;

  return (
    <AbsoluteFill style={{ background: P.void, overflow: "hidden" }}>
      <AbsoluteFill style={{ opacity: 1 - end * 0.8, filter: rewinding ? "saturate(0.25) contrast(1.25) brightness(1.1)" : undefined }}>
        <Stars cam={cam} />

        {/* the bridge of code the agent can read */}
        {Array.from({ length: BLOCKS }, (_, i) => {
          const wx = i * BLOCK + BLOCK_W / 2;
          const x = sx(wx);
          if (x < -20 * v.u || x > v.width + 20 * v.u) return null;
          const gi = GAP.indexOf(i);
          if (gi >= 0) {
            if (T < 470) return null;
            const g = built(gi, T);
            if (g <= 0) return null;
            return <CodeBlock key={i} x={x} y={v.bridgeY} lit={1} seed={i} grow={g} typed={k(T, [512 + gi * 24, 530 + gi * 24], [0, 1])} />;
          }
          const lit = wx - BLOCK_W / 2 < front ? 1 : 0;
          return <CodeBlock key={i} x={x} y={v.bridgeY} lit={lit} seed={i} />;
        })}

        {/* the hole the package becomes */}
        {hs > 0.01 ? (
          <div style={{ position: "absolute", left: sx(HOLE_X) - (holeW * v.u) / 2, top: v.bridgeY - (holeH * v.u) / 2, width: holeW * v.u, height: holeH * v.u, transform: `scale(${hs})` }}>
            <BlackHole view={{ dist: 24, tilt: 0.2, fov: 1.05, heat: 0.75 + pull * 0.6, clear: true }} t={T / 30} size={{ w: holeW * v.u, h: holeH * v.u }} scale={0.42} />
          </div>
        ) : null}

        <Crate x={sx(HOLE_X)} y={v.bridgeY} T={T} />

        {/* the agent */}
        {T < 470 || respawn > 0 ? (
          <>
            <Torch x={sx(px + 4)} y={v.bridgeY - 0.5 * v.u} len={T >= 392 && T < 470 ? 0 : T >= 470 && T < 580 ? 22 : reach(T)} flicker={flicker * (T >= 470 ? respawn : 1)} />
            <Debris fromX={sx(px)} toX={sx(HOLE_X)} y={v.bridgeY} amount={pull > 0.3 ? pull : 0} frame={frame} />
            <Probe x={sx(px)} y={v.bridgeY - 0.5 * v.u} frame={frame} stretch={stretch} fade={(1 - lost) * respawn} lost={lost} />
          </>
        ) : null}

        {hesitate ? (
          <div
            style={{
              position: "absolute",
              left: sx(px) - v.u * 1.5,
              top: v.bridgeY - v.u * (13 + Math.sin(T / 6)),
              fontFamily: F.sans,
              fontWeight: 700,
              fontSize: v.u * 7,
              color: P.gold,
              opacity: k(T, [304, 314], [0, 1]) * k(T, [380, 390], [1, 0]),
              textShadow: `0 0 ${v.u * 3}px rgba(255,193,94,0.7)`,
            }}
          >
            ?
          </div>
        ) : null}

        {/* the moment it goes in */}
        {T > 455 && T < 500 ? (
          <AbsoluteFill style={{ background: `radial-gradient(circle at ${sx(HOLE_X)}px ${v.bridgeY}px, rgba(255,240,220,${k(T, [462, 470, 500], [0, 0.9, 0])}), rgba(255,107,26,${k(T, [462, 470, 500], [0, 0.4, 0])}) 25%, transparent 60%)` }} />
        ) : null}
      </AbsoluteFill>

      {rewinding ? <Rewind frame={frame} /> : null}

      <div style={{ position: "absolute", left: v.vertical ? 70 : 90, top: v.vertical ? 110 : 70, opacity: 1 - end }}>
        <Label colour={P.amber} size={v.vertical ? 26 : 22}>
          Spaghettification · 01
        </Label>
      </div>

      <Caption text="This is your coding agent." from={0} to={56} />
      <Caption text="It sees what its torch lights." from={102} to={198} />
      <Caption text="Then you add a package." from={212} to={296} hot="package" />
      <Caption text="It can't see inside." from={304} to={386} />
      <Caption text="So it takes it on faith." from={394} to={470} hot="on faith" />
      <Caption text="Or let it write that bit itself." from={504} to={578} />
      <Caption text="Every line visible." from={586} to={650} hot="visible" />

      <EndCard from={656} />

      <Audio src={staticFile("sfx/space/drone.wav")} loop volume={(f) => 0.5 * interpolate(f, [0, 6, FAITH_FRAMES - 30, FAITH_FRAMES], [0, 1, 1, 0], clampOpts)} />
      <Sfx at={0} name="stretch" volume={0.6} />
      <Sfx at={OPEN - 2} name="rewind" volume={0.7} />
      <Sfx at={232} name="boom" volume={0.6} />
      <Sfx at={300} name="ping" volume={0.25} />
      <Sfx at={398} name="whoosh" volume={0.6} />
      <Sfx at={430} name="stretch" volume={0.7} />
      <Sfx at={468} name="boom" volume={0.45} />
      {[0, 1, 2].map((i) => (
        <Sfx key={i} at={507 + i * 24} name="ping" volume={0.3} />
      ))}
    </AbsoluteFill>
  );
};

const Rewind: React.FC<{ frame: number }> = ({ frame }) => {
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

const EndCard: React.FC<{ from: number }> = ({ from }) => {
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
        Every dependency is a gap your agent can't see into.
      </div>
      <div style={{ fontFamily: F.mono, fontSize: vertical ? 32 : 30, color: P.gold, marginTop: 44, opacity: b }}>marcomark.co.uk/blog/spaghettification</div>
    </AbsoluteFill>
  );
};
