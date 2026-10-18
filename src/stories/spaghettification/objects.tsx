import React from "react";
import { interpolate, random, useCurrentFrame } from "remotion";
import type { Script, Stage, Timeline } from "./Spaghettification";
import { Box, F, fadeIn, fadeOut, Infall, Label, P, Sfx } from "./space";

// One script per black hole in the post. The words are Marco's, trimmed to fit a short clip.

const Panel: React.FC<{ box: Box; title: string; titleColour?: string; opacity: number; children: React.ReactNode; s: Stage }> = ({
  box,
  title,
  titleColour = P.dust,
  opacity,
  children,
  s,
}) => (
  <div
    style={{
      position: "absolute",
      left: box.x,
      top: box.y,
      width: box.w,
      height: box.h,
      opacity,
      transform: `translateY(${(1 - opacity) * 20}px)`,
      border: `1.5px solid rgba(169,107,255,0.45)`,
      background: "rgba(12,8,32,0.72)",
      boxShadow: "0 0 60px rgba(107,79,214,0.25), inset 0 0 40px rgba(107,79,214,0.12)",
      backdropFilter: "blur(6px)",
      padding: s.vertical ? "26px 30px" : "18px 24px",
      boxSizing: "border-box",
      overflow: "hidden",
    }}
  >
    <Label colour={titleColour} size={s.vertical ? 20 : 16} style={{ marginBottom: s.vertical ? 18 : 12 }}>
      {title}
    </Label>
    {children}
  </div>
);

const Typed: React.FC<{ text: string; at: number; cps?: number }> = ({ text, at, cps = 40 }) => {
  const frame = useCurrentFrame();
  const n = Math.max(0, Math.floor(((frame - at) / 30) * cps));
  return <>{text.slice(0, n)}</>;
};

// ---------------------------------------------------------------- 01

const CODE = [
  "export function formatDate(date: Date) {",
  '  const d = String(date.getDate()).padStart(2, "0");',
  '  const m = String(date.getMonth() + 1).padStart(2, "0");',
  "  return `${d}/${m}/${date.getFullYear()}`;",
  "}",
];

const DependencyVisual: React.FC<{ t: Timeline; s: Stage; rIn: number }> = ({ t, s, rIn }) => {
  const frame = useCurrentFrame();
  const flip = t.beats[2][0];
  const show = fadeIn(frame, flip, 14) * fadeOut(frame, t.horizon[1] - 14);
  const size = s.vertical ? 23 : 19;
  return (
    <>
      <Infall
        tokens={["import", 'from "…"', "node_modules/", "^4.2.1", "require()", "package.json", "npm install", "dist/index.min.js", "peerDependencies", "postinstall"]}
        from={-70}
        to={flip - 30}
        every={8}
        hole={s.hole}
        rIn={rIn}
        rOut={s.vertical ? 560 : 640}
        size={s.vertical ? 30 : 26}
        seed="dep"
      />
      <Panel box={s.slot} title="Your codebase · every line visible" titleColour={P.gold} opacity={show} s={s}>
        <div style={{ fontFamily: F.mono, fontSize: size, lineHeight: 1.45, color: P.starlight, whiteSpace: "pre" }}>
          {CODE.map((line, i) => (
            <div key={i}>
              <Typed text={line} at={flip + 10 + i * 14} cps={90} />
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
};

export const dependency: Script = {
  n: 1,
  object: "The Dependency Singularity",
  hook: "A dependency is a black hole *you invite in*.",
  beats: [
    "Your agent can't see inside it. So it *takes it on faith*.",
    "That used to be a good trade. But as agents get faster, *the maths quietly flips*.",
    "What a small library saved you, the agent can just write. *Where every line is visible.*",
    "Big libraries still earn their place. A half-used one is *a gap you didn't need to open*.",
  ],
  horizonLabel: "Event horizon",
  horizon: "The less it takes on faith, *the less it has to guess*.",
  camera: { from: { dist: 34, tilt: 0.2, heat: 0.6 }, to: { dist: 21, tilt: 0.14, heat: 0.7 } },
  Visual: DependencyVisual,
  sounds: (t) => [0, 1].map((i) => <Sfx key={i} at={8 + i * 70} name="stretch" volume={0.4} />),
};

// ---------------------------------------------------------------- 02

const MemoryVisual: React.FC<{ t: Timeline; s: Stage; rIn: number }> = ({ t, s, rIn }) => {
  const frame = useCurrentFrame();
  const cardsIn = t.beats[1][0];
  const clash = t.beats[1][0] + 40;
  const think = t.beats[2][0];
  const cards = fadeIn(frame, cardsIn, 12) * fadeOut(frame, think - 6, 10);
  const meet = interpolate(frame, [cardsIn, clash], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const hit = Math.exp(-Math.max(0, frame - clash) / 5) * (frame >= clash ? 1 : 0);
  const jitter = hit * 14;
  const box = s.slot;
  const cw = box.w * 0.46;
  const card = (title: string, body: string, side: -1 | 1, colour: string) => (
    <div
      style={{
        position: "absolute",
        top: box.y + (s.vertical ? 30 : 10),
        left: box.x + box.w / 2 - cw / 2 + side * (cw / 2 + 10 + meet * 120) + Math.sin(frame * 3 + side) * jitter,
        width: cw,
        padding: s.vertical ? "26px 28px" : "16px 20px",
        boxSizing: "border-box",
        border: `2px solid ${colour}`,
        background: "rgba(12,8,32,0.8)",
        boxShadow: `0 0 ${30 + hit * 80}px ${colour}`,
        transform: `rotate(${side * (2 + meet * 6)}deg)`,
        opacity: cards,
      }}
    >
      <Label colour={colour} size={s.vertical ? 22 : 17}>
        {title}
      </Label>
      <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: s.vertical ? 46 : 34, color: P.starlight, marginTop: 10 }}>{body}</div>
    </div>
  );
  const qs = ["Why is this mentioned when I was asked about that?", "Should I reconcile them?", "Pick one?"];
  const thinking = fadeIn(frame, think, 10) * fadeOut(frame, t.horizon[0] - 4, 12);
  const drain = interpolate(frame, [think, t.beats[3][1]], [1, 0.12], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      <Infall
        tokens={["memory.md", "skills/", "always…", "never…", "unless…", "team workflow", "as discussed", "remember to", "prefer", "don't"]}
        from={-70}
        to={t.horizon[1]}
        every={10}
        hole={s.hole}
        rIn={rIn}
        rOut={s.vertical ? 560 : 640}
        size={s.vertical ? 28 : 24}
        seed="mem"
        colour="#cdbfff"
      />
      {card("Standing context", "says one thing", -1, P.violet)}
      {card("Your prompt", "says another", 1, P.amber)}
      {hit > 0.02 ? (
        <div style={{ position: "absolute", left: box.x + box.w / 2 - 150, top: box.y + 40, width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, rgba(255,241,220,${hit}) 0%, rgba(255,107,26,${hit * 0.5}) 35%, transparent 70%)` }} />
      ) : null}
      <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, opacity: thinking }}>
        <Label colour={P.violet} size={s.vertical ? 20 : 16}>
          Agent, thinking
        </Label>
        <div style={{ fontFamily: F.mono, fontSize: s.vertical ? 34 : 22, lineHeight: 1.45, color: "#cdbfff", marginTop: 12 }}>
          {qs.map((q, i) => (
            <div key={i}>
              <span style={{ color: P.dust }}>› </span>
              <Typed text={q} at={think + 6 + i * 26} cps={55} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: s.vertical ? 24 : 12, display: "flex", alignItems: "center", gap: 16 }}>
          <Label colour={P.dust} size={s.vertical ? 18 : 14} style={{ whiteSpace: "nowrap" }}>
            Attention on your task
          </Label>
          <div style={{ flex: 1, height: s.vertical ? 12 : 9, background: "rgba(148,136,184,0.2)" }}>
            <div style={{ width: `${drain * 100}%`, height: "100%", background: drain > 0.4 ? P.gold : P.ember, boxShadow: `0 0 16px ${P.ember}` }} />
          </div>
        </div>
      </div>
    </>
  );
};

export const memory: Script = {
  n: 2,
  object: "The Memory Nebula",
  hook: "Agent memory often causes *more confusion than it helps*.",
  beats: [
    "The problem is *contradiction*.",
    "Your standing context says one thing. Your prompt says another.",
    "So the agent *stops to reconcile them* before it can do anything.",
    "That's attention spent *away from the task you actually set*.",
    "Newer models cope. But surviving a conflict isn't the same as *not having one*.",
  ],
  horizonLabel: "Event horizon",
  horizon: "Conflicting context is a black hole *made of your own notes*.",
  camera: { from: { dist: 30, tilt: 0.26, heat: 0.5, hueShift: 0.8, roll: -0.12 }, to: { dist: 22, tilt: 0.18, heat: 0.55, hueShift: 0.7, roll: 0.05 } },
  Visual: MemoryVisual,
  sounds: (t) => <Sfx at={t.beats[1][0] + 40} name="boom" volume={0.45} />,
};

// ---------------------------------------------------------------- 03

const COLS = ["month", "orders", "returns"];
const DataVisual: React.FC<{ t: Timeline; s: Stage; rIn: number }> = ({ t, s, rIn }) => {
  const frame = useCurrentFrame();
  const improvise = t.beats[0][0];
  const attach = t.horizon[0];
  const show = fadeIn(frame, 0, 10) * fadeOut(frame, t.end[0] - 14);
  const mode = frame < improvise ? "void" : frame < attach ? "made-up" : "real";
  const cell = (r: number, c: number) => {
    if (mode === "void") return "░░░░";
    if (mode === "made-up") {
      // Values that won't sit still, because nothing is holding them in place.
      const tick = Math.floor(frame / 4);
      if (c === 0) return ["Jan", "Feb", "Mar"][r];
      return String(Math.floor(random(`m-${r}-${c}-${tick}`) * 9000 + 300));
    }
    if (c === 0) return ["Jan", "Feb", "Mar"][r];
    return String(Math.floor(random(`real-${r}-${c}`) * 4000 + 900));
  };
  const stamp = mode === "void" ? "No access" : mode === "made-up" ? "Improvised" : "Actual access";
  const stampColour = mode === "void" ? P.dust : mode === "made-up" ? P.ember : P.gold;
  const stampIn = mode === "void" ? fadeIn(frame, 6) : mode === "made-up" ? fadeIn(frame, improvise, 6) : fadeIn(frame, attach, 6);
  const size = s.vertical ? 34 : 24;
  const box = s.slot;
  return (
    <>
      <Infall
        tokens={["the data", "the numbers", "rows", "schema?", "totals", "last month", "the export", "trend", "the figures"]}
        from={-70}
        to={attach - 30}
        every={10}
        hole={s.hole}
        rIn={rIn}
        rOut={s.vertical ? 560 : 640}
        size={s.vertical ? 28 : 24}
        seed="data"
        colour="#cdbfff"
      />
      <Panel box={box} title="The data, as described in the task" opacity={show} s={s}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", fontFamily: F.mono, fontSize: size, lineHeight: s.vertical ? 1.6 : 1.4, columnGap: 20 }}>
          {COLS.map((c) => (
            <div key={c} style={{ color: P.dust, borderBottom: "1px solid rgba(148,136,184,0.4)" }}>
              {c}
            </div>
          ))}
          {[0, 1, 2].flatMap((r) =>
            [0, 1, 2].map((c) => (
              <div key={`${r}-${c}`} style={{ color: mode === "made-up" && c > 0 ? P.amber : mode === "void" ? "rgba(148,136,184,0.35)" : P.starlight, textShadow: mode === "made-up" && c > 0 ? `0 0 12px ${P.ember}` : undefined }}>
                {cell(r, c)}
              </div>
            )),
          )}
        </div>
      </Panel>
      <div
        style={{
          position: "absolute",
          left: box.x + box.w - (s.vertical ? 330 : 270),
          top: box.y + (s.vertical ? 150 : 80),
          transform: `rotate(-8deg) scale(${1 + (1 - stampIn) * 0.8})`,
          opacity: stampIn * show,
          border: `4px double ${stampColour}`,
          padding: "6px 16px",
          color: stampColour,
          fontFamily: F.mono,
          fontWeight: 600,
          fontSize: s.vertical ? 30 : 22,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          background: "rgba(5,3,10,0.6)",
        }}
      >
        {stamp}
      </div>
    </>
  );
};

export const data: Script = {
  n: 3,
  object: "The Data Void",
  hook: "Describe data your agent can't see, and it will *make sh∗t up*.",
  beats: [
    "Because you made it sound like *it should already know*.",
    "So it fills the gap *rather than admit the gap exists*.",
    "Newer models are better at saying *“hang on, I can't actually see this.”*",
    "But it's still a risk. And *an easy one to remove*.",
  ],
  horizonLabel: "Event horizon",
  horizon: "The fix is not a better prompt. *It's actual access.*",
  camera: { from: { dist: 22, tilt: 0.3, heat: 0.25, hueShift: 0.35 }, to: { dist: 30, tilt: 0.22, heat: 0.4, hueShift: 0.25 } },
  Visual: DataVisual,
  sounds: (t) => [0, 1, 2, 3, 4].map((i) => <Sfx key={i} at={t.beats[0][0] + i * 23} name="glitch" volume={0.35} />),
};

// ---------------------------------------------------------------- 04

const HorizonVisual: React.FC<{ t: Timeline; s: Stage; rIn: number }> = ({ t, s }) => {
  const frame = useCurrentFrame();
  const box = s.slot;
  const blame = fadeIn(frame, 0, 10) * fadeOut(frame, t.horizon[1] - 10);
  const reveal = t.beats[3][0] + 20;
  const real = fadeIn(frame, reveal, 14) * fadeOut(frame, t.horizon[1] - 10);
  const lineY = box.y + box.h * (s.vertical ? 0.36 : 0.3);
  const pulse = 0.6 + 0.4 * Math.sin(frame / 6);
  const fake = interpolate(frame, [reveal, reveal + 20], [1, 0.35], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tx = box.x + box.w * (s.vertical ? 0.72 : 0.78);
  const ty = box.y + box.h * (s.vertical ? 0.78 : 0.78);
  const dash = (frame * 1.5) % 40;
  return (
    <>
      <div style={{ position: "absolute", left: box.x, top: lineY, width: box.w, height: 3, background: `linear-gradient(90deg, transparent, ${P.amber}, transparent)`, boxShadow: `0 0 ${20 * pulse}px ${P.ember}`, opacity: blame * fake }} />
      <div style={{ position: "absolute", left: box.x, top: lineY - (s.vertical ? 56 : 44), opacity: blame * fake }}>
        <Label colour={P.amber} size={s.vertical ? 22 : 17}>
          Dev stack · looks like the edge
        </Label>
      </div>
      <div style={{ position: "absolute", left: box.x + box.w * 0.08, top: lineY + 18, fontFamily: F.mono, fontSize: s.vertical ? 28 : 21, color: "#cdbfff", opacity: blame * fake }}>
        <span style={{ color: P.dust }}>agent › </span>
        <Typed text="“must be broken”" at={6} cps={30} />
      </div>
      <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: real }} width={1} height={1}>
        <circle cx={tx} cy={ty} r={s.vertical ? 44 : 30} fill="none" stroke={P.gold} strokeWidth={3} strokeDasharray="10 8" strokeDashoffset={dash} />
        <circle cx={tx} cy={ty} r={6} fill={P.gold} />
      </svg>
      <div style={{ position: "absolute", left: tx - (s.vertical ? 380 : 330), top: ty - 14, width: s.vertical ? 320 : 280, textAlign: "right", opacity: real }}>
        <Label colour={P.gold} size={s.vertical ? 22 : 17}>
          The actual problem
        </Label>
      </div>
    </>
  );
};

export const falseHorizon: Script = {
  n: 4,
  object: "The False Horizon",
  hook: "*“Hot module reloading must be broken.”*",
  beats: [
    "It almost never is.",
    "When a result isn't what it expected, the agent blames *the part it can't fully see*.",
    "Same shape as *“the failing tests must be unrelated to my work.”*",
    "It looks like the edge of the problem. *The real problem is somewhere else.*",
    "I haven't worked out how to avoid this one yet.",
  ],
  horizonLabel: "Still falling",
  horizon: "If you've cracked it, *I'd like to know*.",
  camera: { from: { dist: 30, tilt: 0.05, heat: 0.65 }, to: { dist: 17, tilt: 0.03, heat: 0.75 } },
  Visual: HorizonVisual,
};

export const SERIES = [dependency, memory, data, falseHorizon];
