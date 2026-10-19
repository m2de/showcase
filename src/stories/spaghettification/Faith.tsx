import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { BlackHole } from "./BlackHole";
import { BLOCK_W, Caption, clampOpts, CodeBlock, Debris, EndCard, k, Probe, Rewind, Stars, Torch, useView } from "./probe";
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
const GAP = [12, 13, 14]; // where the package lands
const HOLE_X = 13 * BLOCK + BLOCK_W / 2;
const BLOCKS = 34;


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

      <EndCard from={656} line="Every dependency is a gap your agent can't see into." />

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

