import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { BLOCK_W, Caption, clampOpts, CodeBlock, EndCard, k, Probe, Rewind, Stars, Torch, useView } from "./probe";
import { Label, P, Sfx } from "./space";

// Spaghettification 03: The Data Void.
// From marcomark.co.uk/blog/spaghettification.html: "If you frame a task as though the agent
// understands the data, but it has no actual access to that data, it will literally just make shit
// up ... The fix is not a better prompt. It is actual access." Told with the probe: the data is a
// planet in the dark, the torch can't reach it, so the probe projects one it made up.

const OPEN = 60;
const REWIND_END = 92;
export const VOID_FRAMES = 660;

const storyTime = (frame: number) => {
  if (frame < OPEN) return interpolate(frame, [0, OPEN], [372, 418]);
  if (frame < REWIND_END) return interpolate(frame, [OPEN, REWIND_END], [418, 92], { easing: Easing.inOut(Easing.cubic) });
  return frame;
};

const BLOCK = 14;
const STOP = 20;
const GAP = 27; // probe to the data's centre

// The invented planet: loud, banded, ringed, and flickering like a projection.
const Hologram: React.FC<{ x: number; y: number; r: number; on: number; shatter: number; frame: number }> = ({ x, y, r, on, shatter, frame }) => {
  if (on <= 0.01) return null;
  const flick = 0.82 + 0.18 * Math.sin(frame * 1.3) * Math.sin(frame * 0.37);
  const jitter = (random(`hj${Math.floor(frame / 3)}`) - 0.5) * r * 0.04;
  return (
    <div style={{ position: "absolute", left: x - r * 1.8 + jitter, top: y - r * 1.8, width: r * 3.6, height: r * 3.6, opacity: on * flick * (1 - shatter), transform: `scale(${(0.6 + 0.4 * on) * (1 + shatter * 0.4)})`, filter: shatter > 0 ? `blur(${shatter * 12}px)` : undefined }}>
      <svg width="100%" height="100%" viewBox="-1.8 -1.8 3.6 3.6" style={{ overflow: "visible" }}>
        <defs>
          <radialGradient id="holo" cx="-0.3" cy="-0.3" r="1.4" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#ffe08a" />
            <stop offset="0.5" stopColor={P.ember} />
            <stop offset="1" stopColor="#c2185b" />
          </radialGradient>
          <clipPath id="holoClip">
            <circle r={1} />
          </clipPath>
        </defs>
        <ellipse rx={1.7} ry={0.36} fill="none" stroke={P.gold} strokeWidth={0.06} transform="rotate(-18)" opacity={0.8} />
        <circle r={1} fill="url(#holo)" />
        <g clipPath="url(#holoClip)">
          {[-0.6, -0.25, 0.1, 0.45, 0.75].map((by, i) => (
            <rect key={i} x={-1.2} y={by + Math.sin(frame / 15 + i) * 0.03} width={2.4} height={0.1 + (i % 2) * 0.07} fill={i % 2 ? "#ff8a3d" : "#fff1c2"} opacity={0.55} />
          ))}
          {Array.from({ length: 22 }, (_, i) => (
            <rect key={`s${i}`} x={-1.2} y={-1 + i * 0.095} width={2.4} height={0.03} fill="#05030a" opacity={0.35} />
          ))}
        </g>
        <path d="M -1.7 0.52 A 1.7 0.36 0 0 0 1.7 -0.52" fill="none" stroke={P.gold} strokeWidth={0.06} transform="rotate(-18) translate(0 0)" opacity={0} />
        {/* chromatic ghost */}
        <circle r={1} cx={0.04} fill="none" stroke="#00e5ff" strokeWidth={0.02} opacity={0.5} />
        <circle r={1} cx={-0.04} fill="none" stroke="#ff2bd6" strokeWidth={0.02} opacity={0.5} />
      </svg>
    </div>
  );
};

// The real data: quieter, cooler, cratered. Lit only when the probe can actually reach it.
const Planet: React.FC<{ x: number; y: number; r: number; lit: number; scan: number; frame: number }> = ({ x, y, r, lit, scan, frame }) => {
  const dash = (frame * 0.8) % 40;
  return (
    <div style={{ position: "absolute", left: x - r * 1.4, top: y - r * 1.4, width: r * 2.8, height: r * 2.8 }}>
      <svg width="100%" height="100%" viewBox="-1.4 -1.4 2.8 2.8" style={{ overflow: "visible" }}>
        <defs>
          <radialGradient id="real" cx="-0.45" cy="-0.35" r="1.5" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#bfe4ff" />
            <stop offset="0.45" stopColor="#4f7fd6" />
            <stop offset="1" stopColor="#1b1f5a" />
          </radialGradient>
          <clipPath id="realClip">
            <circle r={1} />
          </clipPath>
        </defs>
        {/* unseen: a dashed outline and nothing else */}
        <circle r={1.04} fill="#05030a" stroke="rgba(148,136,184,0.5)" strokeWidth={0.025} strokeDasharray="0.08 0.07" strokeDashoffset={dash / 200} opacity={1 - lit} />
        <g opacity={lit} clipPath="url(#realClip)">
          <circle r={1} fill="url(#real)" />
          {[
            [-0.35, 0.2, 0.16],
            [0.3, -0.4, 0.11],
            [0.45, 0.35, 0.2],
            [-0.15, -0.55, 0.08],
            [0.05, 0.62, 0.09],
          ].map(([cx, cy, cr], i) => (
            <circle key={i} cx={cx} cy={cy} r={cr} fill="rgba(20,24,70,0.35)" stroke="rgba(191,228,255,0.35)" strokeWidth={0.015} />
          ))}
          <circle r={1} cx={0.5} cy={0.15} fill="rgba(5,3,10,0.55)" />
          {scan > 0 && scan < 1 ? <rect x={-1.1} y={-1 + scan * 2} width={2.2} height={0.035} fill="#7dffb0" opacity={0.9} /> : null}
        </g>
        <circle r={1} fill="none" stroke="#9fd0ff" strokeWidth={0.02} opacity={lit * 0.7} />
      </svg>
    </div>
  );
};

export const Void: React.FC = () => {
  const frame = useCurrentFrame();
  const v = useView();
  const T = storyTime(frame);
  const cam = STOP;
  const sx = (wx: number) => (wx - cam) * v.u + v.anchor;
  const y = v.bridgeY - 0.5 * v.u;
  const px = k(T, [92, 170], [-14, STOP], Easing.out(Easing.cubic));
  const R = (v.vertical ? 9.5 : 11) * v.u;
  const planetX = sx(STOP + GAP);
  const holoOn = T < 430 ? k(T, [262, 290], [0, 1], Easing.out(Easing.back(1.4))) : 1;
  const shatter = k(T, [430, 450], [0, 1], Easing.in(Easing.quad));
  const cable = k(T, [424, 446], [0, 1], Easing.out(Easing.cubic));
  const lit = k(T, [440, 470], [0, 1]);
  const scan = k(T, [472, 540], [0, 1], Easing.inOut(Easing.quad));
  const torchLen = T < 430 ? Math.min(GAP - 4 - R / v.u - 1, 30) : GAP - 4;
  const projecting = T >= 262 && T < 430;
  const end = interpolate(frame, [588, 606], [0, 1], clampOpts);
  const rewinding = frame >= OPEN && frame < REWIND_END;
  const lensX = sx(px + 4);

  return (
    <AbsoluteFill style={{ background: P.void, overflow: "hidden" }}>
      <AbsoluteFill style={{ opacity: 1 - end * 0.8, filter: rewinding ? "saturate(0.25) contrast(1.25) brightness(1.1)" : undefined }}>
        <Stars cam={cam} />
        <AbsoluteFill style={{ background: `radial-gradient(circle ${R * 2.4}px at ${planetX}px ${y}px, rgba(5,3,10,0.95) 40%, transparent 100%)` }} />

        {Array.from({ length: 4 }, (_, i) => {
          const wx = STOP + 6 - (3 - i) * BLOCK - BLOCK_W / 2 + 0;
          return <CodeBlock key={i} x={sx(wx)} y={v.bridgeY} lit={1} seed={i + 70} />;
        })}

        <Planet x={planetX} y={y} r={R} lit={lit} scan={scan} frame={frame} />

        {/* the projector cone while it invents */}
        {projecting ? (
          <svg style={{ position: "absolute", inset: 0, overflow: "visible", opacity: holoOn * 0.5 * (1 - shatter) }} width={v.width} height={v.height}>
            <defs>
              <linearGradient id="proj" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor={P.amber} stopOpacity={0.6} />
                <stop offset="1" stopColor={P.amber} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <path d={`M ${lensX} ${y} L ${planetX} ${y - R} L ${planetX} ${y + R} Z`} fill="url(#proj)" />
          </svg>
        ) : null}

        <Hologram x={planetX} y={y} r={R} on={holoOn} shatter={shatter} frame={frame} />

        {/* actual access: a line out to the data, with packets coming back */}
        {cable > 0 ? (
          <svg style={{ position: "absolute", inset: 0, overflow: "visible" }} width={v.width} height={v.height}>
            <line x1={lensX} y1={y + v.u * 2} x2={lensX + (planetX - R - lensX) * cable} y2={y + v.u * 2} stroke={P.gold} strokeWidth={Math.max(3, v.u * 0.35)} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 ${v.u}px ${P.gold})` }} />
            {cable >= 1
              ? [0, 1, 2, 3].map((i) => {
                  const p = ((frame / 25 + i / 4) % 1);
                  return <circle key={i} cx={planetX - R - (planetX - R - lensX) * p} cy={y + v.u * 2} r={v.u * 0.5} fill="#fff6e0" />;
                })
              : null}
          </svg>
        ) : null}

        <Torch x={lensX} y={y} len={T < 120 ? 0 : torchLen} flicker={T > 180 && T < 262 ? 0.75 + 0.25 * Math.sin(T * 0.8) : 1} />
        <Probe x={sx(px)} y={y} frame={frame} />

        {/* a confident little tick, at exactly the wrong moment */}
        {T > 300 && T < 430 ? (
          <div style={{ position: "absolute", left: sx(px) - v.u * 2, top: y - v.u * 12, fontSize: v.u * 6, color: "#7dffb0", fontWeight: 700, opacity: k(T, [300, 312], [0, 1]) * k(T, [418, 430], [1, 0]), textShadow: "0 0 20px rgba(125,255,176,0.7)" }}>✓</div>
        ) : null}
        {T > 540 ? (
          <div style={{ position: "absolute", left: sx(px) - v.u * 2, top: y - v.u * 12, fontSize: v.u * 6, color: "#7dffb0", fontWeight: 700, opacity: k(T, [540, 552], [0, 1]), textShadow: "0 0 20px rgba(125,255,176,0.7)" }}>✓</div>
        ) : null}
        {shatter > 0 && shatter < 1 ? (
          <AbsoluteFill style={{ background: `radial-gradient(circle at ${planetX}px ${y}px, rgba(255,240,220,${0.5 * Math.sin(shatter * Math.PI)}), transparent ${R * 2}px)` }} />
        ) : null}
      </AbsoluteFill>

      {rewinding ? <Rewind frame={frame} /> : null}

      <div style={{ position: "absolute", left: v.vertical ? 70 : 90, top: v.vertical ? 110 : 70, opacity: 1 - end }}>
        <Label colour={P.amber} size={v.vertical ? 26 : 22}>
          Spaghettification · 03
        </Label>
      </div>

      <Caption text="Your agent just made this up." from={0} to={56} hot="made this up" />
      <Caption text="You ask it about your data." from={102} to={182} hot="data" />
      <Caption text="It can't see it." from={190} to={256} />
      <Caption text="It won't admit the gap." from={266} to={340} />
      <Caption text="So it makes sh∗t up." from={346} to={418} hot="sh∗t" />
      <Caption text="Give it actual access." from={428} to={500} hot="actual access" />
      <Caption text="Now it can see it." from={508} to={584} />

      <EndCard from={592} line="The fix isn't a better prompt. It's actual access." />

      <Audio src={staticFile("sfx/space/drone.wav")} loop volume={(f) => 0.5 * interpolate(f, [0, 6, VOID_FRAMES - 30, VOID_FRAMES], [0, 1, 1, 0], clampOpts)} />
      <Sfx at={0} name="glitch" volume={0.35} />
      <Sfx at={OPEN - 2} name="rewind" volume={0.7} />
      <Sfx at={200} name="ping" volume={0.2} />
      <Sfx at={262} name="whoosh" volume={0.5} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Sfx key={i} at={290 + i * 26} name="glitch" volume={0.2} />
      ))}
      <Sfx at={430} name="boom" volume={0.45} />
      <Sfx at={472} name="stretch" volume={0.3} />
      <Sfx at={540} name="ping" volume={0.35} />
    </AbsoluteFill>
  );
};
