import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { BLOCK_W, Caption, clampOpts, CodeBlock, EndCard, k, Probe, Rewind, Stars, Torch, useView } from "./probe";
import { F, Label, P, Sfx } from "./space";

// Spaghettification 02: The Memory Nebula.
// From marcomark.co.uk/blog/spaghettification.html: "The moment your standing context says one
// thing and your prompt says another, the agent has to stop and reconcile the two before it can do
// anything ... you pay for every token of the detour." Told with the probe: a task beacon ahead,
// a cloud of its own notes around it, one note pulling the other way, and the probe going in circles.

const OPEN = 60;
const REWIND_END = 92;
export const NEBULA_FRAMES = 700;

const storyTime = (frame: number) => {
  if (frame < OPEN) return interpolate(frame, [0, OPEN], [352, 412]);
  if (frame < REWIND_END) return interpolate(frame, [OPEN, REWIND_END], [412, 92], { easing: Easing.inOut(Easing.cubic) });
  return frame;
};

const BLOCK = 14;
const STOP = 50;

// Where the probe is. It cruises, brakes, then loops in a figure of eight while it dithers.
const probeAt = (T: number, beacon: number) => {
  if (T < 330) return { x: k(T, [92, 200, 300, 330], [6, 38, STOP - 1, STOP], Easing.inOut(Easing.quad)), y: 0, facing: 1 };
  if (T < 470) {
    const t = (T - 330) / 30;
    const x = STOP + Math.sin(t * 2.1) * 4.5;
    const y = Math.sin(t * 4.2) * 3.2;
    // It faces whichever way it's heading, so it keeps turning round.
    const facing = Math.cos(t * 2.1) >= 0 ? 1 : -1;
    const settle = k(T, [455, 470], [1, 0]);
    return { x: STOP + (x - STOP) * settle, y: y * settle, facing: settle > 0.5 ? facing : 1 };
  }
  return { x: k(T, [470, 515, 590], [STOP, STOP, beacon - 7], Easing.inOut(Easing.cubic)), y: 0, facing: 1 };
};

// The probe's own notes: memory, skills, workflows. One of them disagrees with the task.
// They sit in a loose ring round the probe's stopping point, clear of the bridge itself.
const NOTES = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2 + 0.3;
  const top = Math.sin(a) < 0;
  return {
    x: STOP + 4 + Math.cos(a) * (19 + random(`nx${i}`) * 4),
    y: (top ? -1 : 1) * (8 + Math.abs(Math.sin(a)) * 4 + random(`ny${i}`) * 1.5),
    r: (random(`nr${i}`) - 0.5) * 22,
    delay: i * 7,
  };
}).filter((n) => Math.abs(n.x - 64) > 5 || n.y > 0);
const CULPRIT = { x: 64, y: -12 };
// The note that disagrees glows hot pink-violet, so its pull reads apart from the gold of the task.
const CLASH = "#e27bff";

const Note: React.FC<{ x: number; y: number; r: number; scale: number; glow: number; burn?: number; frame: number; seed: number }> = ({ x, y, r, scale, glow, burn = 0, frame, seed }) => {
  const { u } = useView();
  if (scale <= 0.01) return null;
  const w = 8 * u;
  const h = 6 * u;
  const drift = Math.sin(frame / 20 + seed) * u * 0.6;
  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y - h / 2 + drift,
        width: w,
        height: h,
        transform: `rotate(${r + burn * 40}deg) scale(${scale * (1 - burn)})`,
        borderRadius: u * 0.5,
        border: `${Math.max(1.5, u * 0.16)}px solid ${burn > 0 ? P.ember : glow > 0.5 ? CLASH : P.violet}`,
        background: `rgba(${burn > 0 ? "60,20,10" : "40,24,90"},0.75)`,
        boxShadow: glow > 0.5 ? `0 0 ${u * 4}px ${CLASH}` : `0 0 ${u * 1.5}px rgba(169,107,255,0.35)`,
        padding: `${u * 0.9}px ${u}px`,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: u * 0.7,
        opacity: 1 - burn * 0.6,
      }}
    >
      {[0.8, 0.55, 0.7].map((len, j) => (
        <div key={j} style={{ width: `${len * (0.6 + random(`nl${seed}-${j}`) * 0.4) * 100}%`, height: u * 0.45, borderRadius: u, background: "rgba(205,191,255,0.7)" }} />
      ))}
    </div>
  );
};

// A run of chevrons, flowing one way. The task pulls right in gold; the note pulls left in violet.
const Pull: React.FC<{ from: number; to: number; y: number; colour: string; dir: number; strength: number; frame: number }> = ({ from, to, y, colour, dir, strength, frame }) => {
  const { u } = useView();
  if (strength <= 0.01) return null;
  const n = Math.max(1, Math.floor(Math.abs(to - from) / (u * 4.5)));
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const p = ((i / n + (frame / 40) * dir) % 1 + 1) % 1;
        const x = from + (to - from) * p;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y - u * 2.4,
              fontFamily: F.sans,
              fontWeight: 700,
              fontSize: u * 4.4,
              color: colour,
              opacity: strength * Math.sin(p * Math.PI),
              transform: `scaleX(${dir})`,
              textShadow: `0 0 ${u}px ${colour}`,
            }}
          >
            ›
          </div>
        );
      })}
    </>
  );
};

const Beacon: React.FC<{ x: number; y: number; power: number; frame: number }> = ({ x, y, power, frame }) => {
  const { u } = useView();
  const pulse = 0.85 + 0.15 * Math.sin(frame / 8);
  const r = u * 3 * (0.8 + power * 0.6) * pulse;
  return (
    <div style={{ position: "absolute", left: x, top: y }}>
      <div style={{ position: "absolute", left: -r * 4, top: -r * 4, width: r * 8, height: r * 8, borderRadius: "50%", background: `radial-gradient(circle, rgba(255,193,94,${0.35 * power}) 0%, transparent 65%)` }} />
      <svg style={{ position: "absolute", left: -r, top: -r, overflow: "visible" }} width={r * 2} height={r * 2} viewBox="-1 -1 2 2">
        <path d="M 0 -1 L 0.22 -0.22 L 1 0 L 0.22 0.22 L 0 1 L -0.22 0.22 L -1 0 L -0.22 -0.22 Z" fill={P.gold} opacity={0.4 + 0.6 * power} transform={`rotate(${frame * 0.6})`} />
        <circle r={0.28} fill="#fff6e0" opacity={0.5 + 0.5 * power} />
      </svg>
    </div>
  );
};

export const Nebula: React.FC = () => {
  const frame = useCurrentFrame();
  const v = useView();
  const T = storyTime(frame);
  const beacon = v.vertical ? 70 : 92;
  const cam = v.vertical ? k(T, [92, 280, 515, 590], [30, 34, 34, beacon - 34]) : 30;
  const sx = (wx: number) => (wx - cam) * v.u + v.anchor;
  const sy = (wy: number) => v.bridgeY + wy * v.u;
  const p = probeAt(T, beacon);
  const notesIn = (i: number) => k(T, [182 + NOTES[i].delay, 200 + NOTES[i].delay], [0, 1], Easing.out(Easing.back(1.5)));
  const culpritIn = k(T, [268, 285], [0, 1], Easing.out(Easing.back(1.8)));
  const burn = k(T, [470, 505], [0, 1], Easing.in(Easing.cubic));
  const clash = T >= 290 && T < 470 ? k(T, [290, 305], [0, 1]) * (1 - burn) : 0;
  const dithering = T >= 330 && T < 470;
  const beaconPower = T < 330 ? 0.7 : T < 470 ? k(T, [330, 460], [0.7, 0.2]) : k(T, [500, 590, 600], [0.3, 0.8, 1.4]);
  const torchDir = p.facing;
  const torchColour = torchDir > 0 ? P.gold : P.violet;
  const end = interpolate(frame, [608, 626], [0, 1], clampOpts);
  const rewinding = frame >= OPEN && frame < REWIND_END;
  const lastBlock = Math.floor((beacon - 12) / BLOCK);
  // The detour: the loop it has already flown.
  const trail: string[] = [];
  if (dithering) for (let t = 330; t <= T; t += 2) {
    const q = probeAt(t, beacon);
    trail.push(`${sx(q.x)},${sy(q.y - 0.5)}`);
  }

  return (
    <AbsoluteFill style={{ background: P.void, overflow: "hidden" }}>
      <AbsoluteFill style={{ opacity: 1 - end * 0.8, filter: rewinding ? "saturate(0.25) contrast(1.25) brightness(1.1)" : undefined }}>
        <Stars cam={cam} />
        {/* the nebula itself, thickening as the notes pile in */}
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse ${28 * v.u}px ${20 * v.u}px at ${sx(54)}px ${sy(-2)}px, rgba(169,107,255,${0.28 * k(T, [182, 270], [0, 1]) * (1 - burn * 0.7)}), transparent 70%), radial-gradient(ellipse ${18 * v.u}px ${12 * v.u}px at ${sx(66)}px ${sy(-12)}px, rgba(226,123,255,${0.2 * clash}), transparent 70%)`,
          }}
        />

        {Array.from({ length: lastBlock + 1 }, (_, i) => {
          const wx = i * BLOCK + BLOCK_W / 2;
          const x = sx(wx);
          if (x < -20 * v.u || x > v.width + 20 * v.u) return null;
          return <CodeBlock key={i} x={x} y={v.bridgeY} lit={wx - BLOCK_W / 2 < p.x + 30 ? 1 : 0} seed={i + 40} />;
        })}

        <Beacon x={sx(beacon)} y={v.bridgeY} power={beaconPower} frame={frame} />

        {NOTES.map((n, i) => (
          <Note key={i} x={sx(n.x)} y={sy(n.y)} r={n.r} scale={notesIn(i)} glow={0} frame={frame} seed={i} />
        ))}
        <Note x={sx(CULPRIT.x)} y={sy(CULPRIT.y)} r={-6} scale={culpritIn * 1.35} glow={clash} burn={burn} frame={frame} seed={99} />

        {/* the tug of war */}
        <Pull from={sx(p.x + 5)} to={sx(beacon - 4)} y={v.bridgeY - 6 * v.u} colour={P.gold} dir={1} strength={k(T, [120, 140], [0, 1]) * (T >= 470 ? 1 : 1)} frame={frame} />
        <Pull from={sx(CULPRIT.x - 5)} to={sx(p.x - 12)} y={v.bridgeY - 5.5 * v.u} colour={CLASH} dir={-1} strength={clash} frame={frame} />

        {trail.length > 1 ? <svg style={{ position: "absolute", inset: 0, overflow: "visible" }} width={v.width} height={v.height}><polyline points={trail.join(" ")} fill="none" stroke={P.violet} strokeWidth={Math.max(2, v.u * 0.25)} strokeDasharray={`${v.u} ${v.u * 0.8}`} opacity={0.6} /></svg> : null}

        <Torch x={sx(p.x + 4 * torchDir)} y={sy(p.y - 0.5)} len={dithering ? 16 : 26} flicker={1} dir={torchDir} colour={torchColour} />
        <Probe x={sx(p.x)} y={sy(p.y - 0.5)} frame={frame} facing={p.facing} />

        {/* thinking: a spinner over its head while it dithers */}
        {dithering ? (
          <svg style={{ position: "absolute", left: sx(p.x) - 3 * v.u, top: sy(p.y) - 14 * v.u, overflow: "visible" }} width={6 * v.u} height={6 * v.u} viewBox="-1 -1 2 2">
            <circle r={0.8} fill="none" stroke="rgba(169,107,255,0.25)" strokeWidth={0.16} />
            <path d="M 0 -0.8 A 0.8 0.8 0 0 1 0.8 0" fill="none" stroke={P.violet} strokeWidth={0.16} strokeLinecap="round" transform={`rotate(${T * 9})`} />
          </svg>
        ) : null}

        {burn > 0 && burn < 1 ? (
          <AbsoluteFill style={{ background: `radial-gradient(circle at ${sx(CULPRIT.x)}px ${sy(CULPRIT.y)}px, rgba(255,157,77,${0.6 * Math.sin(burn * Math.PI)}), transparent ${12 * v.u}px)` }} />
        ) : null}
      </AbsoluteFill>

      {rewinding ? <Rewind frame={frame} /> : null}

      <div style={{ position: "absolute", left: v.vertical ? 70 : 90, top: v.vertical ? 110 : 70, opacity: 1 - end }}>
        <Label colour={P.amber} size={v.vertical ? 26 : 22}>
          Spaghettification · 02
        </Label>
      </div>

      <Caption text="Your agent, going in circles." from={0} to={56} />
      <Caption text="You give it a task." from={102} to={178} hot="task" />
      <Caption text="It also has its notes." from={186} to={262} hot="notes" />
      <Caption text="One of them disagrees." from={270} to={330} />
      <Caption text="So it stops to reconcile them." from={336} to={398} />
      <Caption text="You pay for every token of the detour." from={404} to={466} hot="detour" />
      <Caption text="Clear the contradiction." from={474} to={530} />
      <Caption text="Straight to the task." from={538} to={604} />

      <EndCard from={612} line="Conflicting context is a black hole made of your own notes." />

      <Audio src={staticFile("sfx/space/drone.wav")} loop volume={(f) => 0.5 * interpolate(f, [0, 6, NEBULA_FRAMES - 30, NEBULA_FRAMES], [0, 1, 1, 0], clampOpts)} />
      <Sfx at={0} name="glitch" volume={0.3} />
      <Sfx at={OPEN - 2} name="rewind" volume={0.7} />
      {NOTES.filter((_, i) => i % 2 === 0).map((n, i) => (
        <Sfx key={i} at={182 + n.delay} name="ping" volume={0.12} />
      ))}
      <Sfx at={290} name="boom" volume={0.4} />
      {[0, 1, 2, 3].map((i) => (
        <Sfx key={`g${i}`} at={340 + i * 30} name="glitch" volume={0.2} />
      ))}
      <Sfx at={470} name="stretch" volume={0.5} />
      <Sfx at={520} name="whoosh" volume={0.6} />
      <Sfx at={590} name="ping" volume={0.35} />
    </AbsoluteFill>
  );
};
