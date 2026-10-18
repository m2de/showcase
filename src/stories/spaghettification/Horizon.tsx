import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { BLOCK_W, Caption, clampOpts, CodeBlock, EndCard, k, Probe, Rewind, Stars, Torch, useView } from "./probe";
import { F, Label, P, Sfx } from "./space";

// Spaghettification 04: The False Horizon.
// From marcomark.co.uk/blog/spaghettification.html: "When a result is not what the agent expected,
// it tends to blame the part it cannot fully see. The classic is 'hot module reloading must be
// broken.' It almost never is ... I have not worked out how to avoid this one yet. If you have
// cracked it, I would like to know." Told with the probe: it tests its own new block, the result
// comes back wrong, and it blames the shimmering edge ahead while the fault sits right behind it.

const OPEN = 60;
const REWIND_END = 92;
export const HORIZON_FRAMES = 700;

const storyTime = (frame: number) => {
  if (frame < OPEN) return interpolate(frame, [0, OPEN], [262, 318]);
  if (frame < REWIND_END) return interpolate(frame, [OPEN, REWIND_END], [318, 92], { easing: Easing.inOut(Easing.cubic) });
  return frame;
};

const BLOCK = 14;
const NEW_BLOCK = 2; // the block it writes, and gets wrong
const RED = "#ff4d5e";

const Bubble: React.FC<{ x: number; y: number; text: string; show: number }> = ({ x, y, text, show }) => {
  const { u, vertical } = useView();
  if (show <= 0.01) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-20%, -100%) scale(${0.7 + 0.3 * show})`,
        transformOrigin: "20% 100%",
        opacity: show,
        background: "rgba(236,230,255,0.95)",
        color: P.void,
        fontFamily: F.mono,
        fontWeight: 600,
        fontSize: vertical ? u * 1.9 : u * 2.1,
        padding: `${u * 1}px ${u * 1.4}px`,
        borderRadius: u * 1.2,
        whiteSpace: "nowrap",
        boxShadow: "0 0 30px rgba(169,107,255,0.4)",
      }}
    >
      {text}
      <div style={{ position: "absolute", left: "18%", bottom: -u * 1.1, width: 0, height: 0, borderLeft: `${u}px solid transparent`, borderRight: `${u}px solid transparent`, borderTop: `${u * 1.2}px solid rgba(236,230,255,0.95)` }} />
    </div>
  );
};

// The edge it can't see past: a shimmering curtain that looks like the end of the problem.
const Curtain: React.FC<{ x: number; height: number; frame: number; glow: number }> = ({ x, height, frame, glow }) => {
  const { u } = useView();
  return (
    <div style={{ position: "absolute", left: x - u * 6, top: 0, width: u * 12, height }}>
      {Array.from({ length: 7 }, (_, i) => {
        const off = Math.sin(frame / 14 + i * 1.3) * u * 1.6;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: u * 6 + off + (i - 3) * u * 0.9,
              top: 0,
              width: u * (0.8 + (i % 3) * 0.5),
              height: "100%",
              background: `linear-gradient(180deg, transparent 5%, ${i % 2 ? P.violet : P.amber} 50%, transparent 95%)`,
              opacity: (0.45 + 0.3 * Math.sin(frame / 9 + i)) * (0.6 + glow * 0.7),
              filter: `blur(${u * 0.6}px)`,
            }}
          />
        );
      })}
    </div>
  );
};

const Mark: React.FC<{ x: number; y: number; show: number; ok: boolean }> = ({ x, y, show, ok }) => {
  const { u } = useView();
  if (show <= 0.01) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${0.6 + 0.4 * show})`, opacity: show, fontFamily: F.sans, fontWeight: 700, fontSize: u * 5.5, color: ok ? "#7dffb0" : RED, textShadow: `0 0 ${u * 2}px ${ok ? "rgba(125,255,176,0.7)" : "rgba(255,77,94,0.8)"}` }}>
      {ok ? "✓" : "✗"}
    </div>
  );
};

export const Horizon: React.FC = () => {
  const frame = useCurrentFrame();
  const v = useView();
  const T = storyTime(frame);
  const curtainX = v.vertical ? 62 : 74;
  const newX = NEW_BLOCK * BLOCK + BLOCK_W / 2;
  const px = k(T, [92, 120, 150, 175], [6, 18, 18, newX + 9], Easing.inOut(Easing.cubic));
  // Pull back for the reveal so the faulty block and the curtain are both in shot.
  const reveal = k(T, [430, 470], [0, 1]);
  const cam = v.vertical ? k(T, [92, 175, 430, 470], [14, 24, 24, 22]) : 26;
  const sx = (wx: number) => (wx - cam) * v.u + v.anchor;
  const y = v.bridgeY - 0.5 * v.u;
  const built = k(T, [122, 140], [0, 1], Easing.out(Easing.back(1.6)));
  // Two tests, two wrong results.
  const shot = (at: number) => {
    const p = k(T, [at, at + 22, at + 44], [0, 1, 0], Easing.inOut(Easing.quad));
    return { on: T >= at && T < at + 44, x: px + 4 + (curtainX - px - 4) * p };
  };
  const s1 = shot(180);
  const s2 = shot(330);
  const fail1 = k(T, [224, 232], [0, 1]) * k(T, [300, 312], [1, 0]);
  const fail2 = k(T, [374, 382], [0, 1]) * k(T, [420, 430], [1, 0]);
  const blame1 = k(T, [246, 258], [0, 1]) * k(T, [316, 326], [1, 0]);
  const blame2 = k(T, [384, 394], [0, 1]) * k(T, [424, 432], [1, 0]);
  const blaming = T >= 240 && T < 432;
  const end = interpolate(frame, [632, 650], [0, 1], clampOpts);
  const rewinding = frame >= OPEN && frame < REWIND_END;
  const ring = (frame * 1.2) % 40;

  return (
    <AbsoluteFill style={{ background: P.void, overflow: "hidden" }}>
      <AbsoluteFill style={{ opacity: 1 - end * 0.8, filter: rewinding ? "saturate(0.25) contrast(1.25) brightness(1.1)" : undefined }}>
        <Stars cam={cam} />
        <Curtain x={sx(curtainX)} height={v.height} frame={frame} glow={blaming ? 1 : 0.3} />

        {Array.from({ length: 6 }, (_, i) => {
          const wx = (i - 2) * BLOCK + BLOCK_W / 2;
          return <CodeBlock key={i} x={sx(wx)} y={v.bridgeY} lit={1} seed={i + 120} />;
        })}
        {built > 0 ? <CodeBlock x={sx(newX)} y={v.bridgeY} lit={1} seed={7} grow={built} typed={k(T, [128, 146], [0, 1])} /> : null}

        {/* the actual fault, which nobody is looking at */}
        {reveal > 0 ? (
          <>
            <div style={{ position: "absolute", left: sx(newX) - BLOCK_W * v.u * 0.5, top: v.bridgeY - 3.5 * v.u, width: BLOCK_W * v.u, height: 7 * v.u, borderRadius: v.u * 0.8, boxShadow: `0 0 ${v.u * 4}px ${RED}`, border: `${v.u * 0.3}px solid ${RED}`, opacity: reveal, boxSizing: "border-box" }} />
            <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: reveal }} width={1} height={1}>
              <path d={`M ${sx(newX) - v.u * 2} ${v.bridgeY - 3.5 * v.u} l ${v.u * 1.2} ${v.u * 2.4} l ${-v.u * 1.4} ${v.u * 1.6} l ${v.u * 1.6} ${v.u * 3}`} stroke={RED} strokeWidth={v.u * 0.35} fill="none" />
              <ellipse cx={sx(newX)} cy={v.bridgeY} rx={BLOCK_W * v.u * 0.85} ry={7 * v.u} fill="none" stroke={RED} strokeWidth={v.u * 0.3} strokeDasharray={`${v.u * 1.4} ${v.u}`} strokeDashoffset={ring} />
            </svg>
          </>
        ) : null}

        {[s1, s2].map((s, i) => (s.on ? <div key={i} style={{ position: "absolute", left: sx(s.x) - v.u, top: y - v.u, width: v.u * 2, height: v.u * 2, borderRadius: "50%", background: "#fff6e0", boxShadow: `0 0 ${v.u * 3}px ${P.gold}` }} /> : null))}

        <Torch x={sx(px + 4)} y={y} len={blaming ? curtainX - px - 6 : 18} flicker={1} />
        <Probe x={sx(px)} y={y} frame={frame} />

        <Mark x={sx(px + 12)} y={y - 15 * v.u} show={fail1} ok={false} />
        <Mark x={sx(px + 12)} y={y - 15 * v.u} show={fail2} ok={false} />
        <Bubble x={sx(px - 2)} y={y - 5 * v.u} text="hot reload must be broken" show={blame1} />
        <Bubble x={sx(px - 2)} y={y - 5 * v.u} text="tests must be unrelated" show={blame2} />

        {T > 476 ? (
          <div style={{ position: "absolute", left: sx(px) - v.u * 1.6, top: y - v.u * (13 + Math.sin(T / 6)), fontFamily: F.sans, fontWeight: 700, fontSize: v.u * 7, color: P.gold, opacity: k(T, [476, 488], [0, 1]), textShadow: `0 0 ${v.u * 3}px rgba(255,193,94,0.7)` }}>?</div>
        ) : null}
      </AbsoluteFill>

      {rewinding ? <Rewind frame={frame} /> : null}

      <div style={{ position: "absolute", left: v.vertical ? 70 : 90, top: v.vertical ? 110 : 70, opacity: 1 - end }}>
        <Label colour={P.amber} size={v.vertical ? 26 : 22}>
          Spaghettification · 04
        </Label>
      </div>

      <Caption text="Your agent, blaming the wrong thing." from={0} to={56} hot="wrong thing" />
      <Caption text="It writes some code." from={102} to={172} />
      <Caption text="The result isn't what it expected." from={180} to={240} />
      <Caption text="So it blames what it can't fully see." from={246} to={322} hot="can't fully see" />
      <Caption text="Every time." from={330} to={424} />
      <Caption text="The real problem is somewhere else." from={432} to={500} hot="somewhere else" />
      <Caption text="I haven't cracked this one yet." from={506} to={570} />
      <Caption text="Have you?" from={576} to={630} hot="Have you?" />

      <EndCard from={636} line="If you've cracked the false horizon, I'd like to know." />

      <Audio src={staticFile("sfx/space/drone.wav")} loop volume={(f) => 0.5 * interpolate(f, [0, 6, HORIZON_FRAMES - 30, HORIZON_FRAMES], [0, 1, 1, 0], clampOpts)} />
      <Sfx at={0} name="glitch" volume={0.3} />
      <Sfx at={OPEN - 2} name="rewind" volume={0.7} />
      <Sfx at={124} name="ping" volume={0.3} />
      <Sfx at={180} name="whoosh" volume={0.4} />
      <Sfx at={226} name="glitch" volume={0.35} />
      <Sfx at={330} name="whoosh" volume={0.4} />
      <Sfx at={376} name="glitch" volume={0.35} />
      <Sfx at={432} name="boom" volume={0.45} />
      <Sfx at={576} name="ping" volume={0.35} />
    </AbsoluteFill>
  );
};
