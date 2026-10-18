import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, random, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import {
  Banner,
  Cross,
  Desk,
  F,
  Grain,
  Hand,
  Label,
  P,
  PartHeading,
  Redaction,
  Scribble,
  Sfx,
  Sheet,
  SHEET_H,
  SHEET_W,
  Stamp,
  Tick,
  Typed,
  useArrival,
  useExit,
  World,
} from "./dossier";

// Every word on screen is Marco's, from marcomark.co.uk/blog/every-session-is-day-one.html.
// The look is the post's too: an AR-1 induction form. Change the post first, then this.

const serif = (size: number, extra?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: F.serif,
  fontSize: size,
  lineHeight: 1.3,
  ...extra,
});

const At: React.FC<{ x: number; y: number; w?: number; children?: React.ReactNode; style?: React.CSSProperties }> = ({
  x,
  y,
  w,
  children,
  style,
}) => <div style={{ position: "absolute", left: x, top: y, width: w, ...style }}>{children}</div>;

// A sheet that arrives from the right (or below) and is whipped off to the left at `exitAt`.
const Arriving: React.FC<{
  exitAt: number;
  from?: "right" | "below";
  seed: number;
  h?: number;
  hole?: boolean;
  children: React.ReactNode;
}> = ({ exitAt, from = "right", seed, h, hole, children }) => {
  const a = useArrival(0, from, seed % 2 ? -1.2 : 0.9);
  const e = useExit(exitAt);
  return (
    <div style={{ position: "absolute", transform: `translate(${a.dx + e.dx}px, ${a.dy}px) rotate(${a.rotate + e.rotate}deg)`, transformOrigin: "500px 670px" }}>
      <Sheet seed={seed} h={h} hole={hole}>
        {children}
      </Sheet>
    </div>
  );
};

// ---------------------------------------------------------------- 1. the record of service

const Record: React.FC<{ exitAt: number }> = ({ exitAt }) => {
  const field = (label: string, value: string, at: number) => (
    <span style={{ marginRight: 34 }}>
      <span style={{ color: P.khakiText }}>{label} </span>
      <span style={{ borderBottom: `2px solid ${P.ink}`, fontWeight: 700, padding: "0 6px" }}>
        <Typed text={value} at={at} cps={22} />
      </span>
    </span>
  );
  const frame = useCurrentFrame();
  const words = ["EVERY", "SESSION", "IS", "DAY", "ONE"];
  return (
    <World
      hits={[118]}
      shots={[
        { at: 0, rect: { x: 40, y: 60, w: 920, h: 640 } },
        { at: 138, rect: { x: 40, y: 60, w: 920, h: 1220 }, dur: 46 },
      ]}
    >
      <Sfx at={0} name="paper-slide" />
      <Arriving exitAt={exitAt} from="below" seed={3}>
        <At x={70} y={40} style={{ transform: "rotate(-8deg)" }}>
          <Label size={18} style={{ background: P.buffBright, border: `2px solid ${P.khaki}`, padding: "6px 14px", letterSpacing: "0.2em" }}>
            File copy
          </Label>
        </At>
        <div style={{ position: "absolute", left: 80, top: 120, width: 840, height: 610, border: `5px double ${P.ink}` }} />
        <At x={120} y={160} w={760} style={{ display: "flex", justifyContent: "space-between" }}>
          <Label size={18}>Record of service</Label>
          <Label size={18}>Sheet 1 of 1</Label>
        </At>
        <div style={{ position: "absolute", left: 120, top: 205, width: 760, borderTop: `2px solid ${P.khaki}` }} />
        <At x={120} y={235} w={780} style={{ fontFamily: F.mono, fontSize: 22, letterSpacing: "0.06em" }}>
          {field("SERVICE NO.", "000001", 22)}
          {field("NAME:", "session", 40)}
          {field("TERM:", "00:00:30", 56)}
        </At>
        <At x={115} y={300} w={800} style={{ fontFamily: F.stencil, fontWeight: 700, fontSize: 118, lineHeight: 0.98 }}>
          {words.map((w, i) => {
            const at = 74 + i * 7;
            const s = interpolate(frame, [at, at + 5], [1.25, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <span key={w} style={{ display: "inline-block", marginRight: 28, visibility: frame >= at ? "visible" : "hidden", transform: `scale(${s})` }}>
                {w}
                {i === 2 ? <br /> : null}
              </span>
            );
          })}
        </At>
        {words.map((w, i) => (
          <Sfx key={w} at={74 + i * 7} name={`key-${i % 4}`} volume={1} />
        ))}
        <At x={120} y={672} style={{ fontFamily: F.mono, fontSize: 20, letterSpacing: "0.22em", color: P.khakiText }}>
          <Typed text="OPINION. 7 SEPTEMBER 2026. MARCO MARK." at={100} cps={60} sound={false} />
        </At>
        <Stamp text="Valid 30 Secs" at={118} x={735} y={155} size={52} rotate={-12} />
        <At x={110} y={800} w={790} style={serif(42, { fontStyle: "italic", fontWeight: 600 })}>
          <Typed
            text="Agent readiness has nothing to do with prompting, context or which model you picked. It's an onboarding problem, and the induction now happens fifty times a day."
            at={150}
            cps={62}
          />
        </At>
      </Arriving>
    </World>
  );
};

// ---------------------------------------------------------------- 2. the ritual

const Ritual: React.FC<{ exitAt: number }> = ({ exitAt }) => {
  const frame = useCurrentFrame();
  const items: [React.ReactNode, number][] = [
    ["Sort their laptop", 80],
    ["Get them onto the VPN", 80],
    ["Add them to the right repositories", 80],
    ["Find out which of the six things in the README are still true", 120],
    [
      <>
        Explain that <code style={{ fontFamily: F.mono, fontSize: 30, background: "rgba(138,122,92,0.25)", padding: "0 8px" }}>billing-v2</code> isn&rsquo;t the
        billing system
      </>,
      120,
    ],
  ];
  let y = 430;
  const rows = items.map(([text, h], i) => {
    const top = y;
    y += h;
    const shown = frame >= 44 + i * 4;
    return (
      <React.Fragment key={i}>
        <At x={115} y={top + 4} style={{ width: 40, height: 40, border: `3px solid ${P.ink}`, opacity: shown ? 1 : 0 }} />
        <At x={180} y={top} w={700} style={serif(36, { opacity: shown ? 1 : 0 })}>
          {text}
        </At>
        <Tick at={70 + i * 11} x={112} y={top - 14} size={58} />
      </React.Fragment>
    );
  });
  const days = ["M", "T", "W", "T", "F"];
  return (
    <World
      shots={[
        { at: 0, rect: { x: 60, y: 80, w: 880, h: 880 } },
        { at: 128, rect: { x: 60, y: 860, w: 880, h: 460 }, dur: 26 },
      ]}
    >
      <Sfx at={0} name="paper-slide" />
      <Arriving exitAt={exitAt} seed={8}>
        <PartHeading section="AR-1 / Section 1 · Particulars of entry" part="Part 1: The Ritual" y={110} />
        <At x={110} y={330} w={800} style={serif(42, { fontWeight: 600 })}>
          <Typed text="Someone new starts on Monday." at={18} cps={40} />
        </At>
        {rows}
        <At x={110} y={920} w={800} style={{ fontFamily: F.stencil, fontWeight: 700, fontSize: 44 }}>
          <Typed text="THAT TAKES DAYS. OFTEN WEEKS." at={130} cps={34} />
        </At>
        {[0, 1, 2].map((wk) => (
          <React.Fragment key={wk}>
            <At x={110} y={1040 + wk * 86} style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 22, color: P.khakiText, lineHeight: "70px" }}>
              WK {wk + 1}
            </At>
            {days.map((d, i) => {
              const n = wk * 5 + i;
              return (
                <React.Fragment key={i}>
                  <At
                    x={210 + i * 138}
                    y={1030 + wk * 86}
                    style={{ width: 126, height: 74, border: `2px solid ${P.khaki}`, fontFamily: F.mono, fontSize: 22, padding: "4px 8px", color: P.khakiText }}
                  >
                    {d}
                  </At>
                  <Cross at={168 + n * 3} x={240 + i * 138} y={1036 + wk * 86} size={62} />
                </React.Fragment>
              );
            })}
          </React.Fragment>
        ))}
        <Sfx at={168} name="biro" />
        <Sfx at={181} name="biro" />
        <Sfx at={196} name="biro" />
      </Arriving>
    </World>
  );
};

// ---------------------------------------------------------------- 3. the compression

const Compression: React.FC<{ exitAt: number }> = ({ exitAt }) => {
  const frame = useCurrentFrame();
  const start = 100;
  const end = 150;
  const left = Math.round(interpolate(frame, [start, end], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const tickFrames = Array.from({ length: 30 }, (_, i) => Math.round(start + ((i + 1) / 30) * (end - start)));
  const pulse = frame >= end ? interpolate(frame, [end, end + 8], [1.12, 1], { extrapolateRight: "clamp" }) : 1;
  return (
    <World
      hits={[end]}
      shots={[
        { at: 0, rect: { x: 60, y: 80, w: 880, h: 560 } },
        { at: 90, rect: { x: 60, y: 600, w: 880, h: 420 }, dur: 16 },
      ]}
    >
      <Sfx at={0} name="paper-slide" />
      <Arriving exitAt={exitAt} seed={5}>
        <PartHeading section="AR-1 / Section 2 · Period of engagement" part="Part 2: The Compression" y={110} />
        <At x={110} y={340} w={800} style={serif(46)}>
          <Typed text="Every agent session is that same induction." at={16} cps={42} />
        </At>
        <At x={110} y={480} w={800} style={serif(46, { fontWeight: 600, fontStyle: "italic" })}>
          <Typed text="Except it gets about thirty seconds." at={62} cps={36} />
        </At>
        <At x={110} y={660} w={780} style={{ border: `5px double ${P.ink}`, padding: "26px 0 18px", textAlign: "center", opacity: frame >= 88 ? 1 : 0 }}>
          <Label size={22}>Term of service</Label>
          <div
            style={{
              fontFamily: F.stencil,
              fontWeight: 700,
              fontSize: 190,
              lineHeight: 1.05,
              color: left <= 5 ? P.red : P.ink,
              fontVariantNumeric: "tabular-nums",
              transform: `scale(${pulse})`,
            }}
          >
            00:00:{String(left).padStart(2, "0")}
          </div>
        </At>
        {tickFrames.map((t) => (
          <Sfx key={t} at={t} name="tick" volume={0.9} dur={4} />
        ))}
        <Sfx at={end} name="bell" volume={0.8} />
      </Arriving>
    </World>
  );
};

// ---------------------------------------------------------------- 4. fifty times before lunch

const FORMS = 50;
const landAt = (i: number) => Math.round(18 + 150 * Math.pow(i / (FORMS - 1), 0.55));

const MiniForm: React.FC<{ n: number }> = ({ n }) => (
  <>
    <div style={{ position: "absolute", left: 80, top: 120, width: 840, height: 590, border: `5px double ${P.ink}` }} />
    <At x={120} y={160} w={760} style={{ display: "flex", justifyContent: "space-between" }}>
      <Label size={18}>Record of service</Label>
      <Label size={18}>Sheet 1 of 1</Label>
    </At>
    <At x={120} y={235} style={{ fontFamily: F.mono, fontSize: 30, fontWeight: 700 }}>
      SERVICE NO. <span style={{ borderBottom: `3px solid ${P.ink}` }}>{String(n).padStart(6, "0")}</span>
    </At>
    <At x={115} y={310} w={800} style={{ fontFamily: F.stencil, fontWeight: 700, fontSize: 132, lineHeight: 0.98 }}>
      EVERY SESSION IS DAY ONE
    </At>
    <At x={120} y={800} w={760} style={{ fontFamily: F.mono, fontSize: 24, color: P.khakiText, letterSpacing: "0.1em" }}>
      NAME: session &nbsp; TERM: 00:00:30
    </At>
    <div style={{ position: "absolute", left: 790, top: 130, transform: "translate(-50%,-50%) rotate(-12deg)", fontFamily: F.stencil, fontWeight: 700, fontSize: 52, color: P.red, border: `5px double ${P.red}`, padding: "8px 28px", letterSpacing: "0.1em", mixBlendMode: "multiply", opacity: 0.8 }}>
      VALID 30 SECS
    </div>
  </>
);

const Fifty: React.FC<{ exitAt: number }> = ({ exitAt }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const u = Math.min(width, height) / 100;
  const e = useExit(exitAt);
  const landed = Array.from({ length: FORMS }, (_, i) => i).filter((i) => frame >= landAt(i)).length;
  const stampAt = 186;
  const caption = (text: string, at: number, size: number) => (
    <div
      style={{
        background: P.buffBright,
        color: P.ink,
        fontFamily: F.serif,
        fontWeight: 600,
        fontSize: size * u,
        padding: `${1.2 * u}px ${2.4 * u}px`,
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        transform: `rotate(-1deg) translateY(${interpolate(frame, [at, at + 10], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) })}px)`,
        opacity: interpolate(frame, [at, at + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        maxWidth: width * 0.84,
      }}
    >
      {text}
    </div>
  );
  return (
    <>
      <World
        hits={[stampAt]}
        shots={[
          { at: 0, rect: { x: 200, y: 280, w: 600, h: 780 } },
          { at: 24, rect: { x: -260, y: -220, w: 1520, h: 1780 }, dur: 150 },
        ]}
      >
        <div style={{ position: "absolute", transform: `translate(${e.dx}px, 0) rotate(${e.rotate}deg)`, transformOrigin: "500px 670px" }}>
          {Array.from({ length: FORMS }, (_, i) => {
            const at = landAt(i);
            if (frame < at - 6) return null;
            const t = interpolate(frame, [at - 6, at], [0, 1], { extrapolateRight: "clamp", easing: Easing.in(Easing.quad) });
            const ox = (random(`x${i}`) - 0.5) * (i === 0 ? 0 : 420);
            const oy = (random(`y${i}`) - 0.5) * (i === 0 ? 0 : 320);
            const rot = (random(`r${i}`) - 0.5) * (i === 0 ? 2 : 34);
            const scale = interpolate(t, [0, 1], [1.7, 1]);
            return (
              <React.Fragment key={i}>
                <Sfx at={at} name="paper-slap" volume={0.55} dur={12} />
                <div
                  style={{
                    position: "absolute",
                    transform: `translate(${ox}px, ${oy}px) rotate(${rot}deg) scale(${scale})`,
                    transformOrigin: `${SHEET_W / 2}px ${SHEET_H / 2}px`,
                    opacity: t,
                  }}
                >
                  <Sheet seed={i + 11} shadow={interpolate(t, [0, 1], [2, 0.7])} hole={false}>
                    <MiniForm n={i + 1} />
                  </Sheet>
                </div>
              </React.Fragment>
            );
          })}
          <Stamp text="Processed" at={stampAt} x={500} y={640} size={150} rotate={-7} />
        </div>
      </World>
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: 9 * u,
            left: 4 * u,
            fontFamily: F.mono,
            fontWeight: 700,
            fontSize: 3.4 * u,
            color: P.buff,
            background: "rgba(30,26,20,0.75)",
            padding: `${0.8 * u}px ${1.6 * u}px`,
            letterSpacing: "0.12em",
            transform: `translateX(${e.dx}px)`,
          }}
        >
          SERVICE NO. {String(landed).padStart(6, "0")}
        </div>
        <div style={{ position: "absolute", bottom: 10 * u, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 * u, transform: `translateX(${e.dx}px)` }}>
          {frame < 176 ? caption("Then it does the whole thing again from nothing a few minutes later. Then again.", 14, 3.4) : null}
          {frame >= 176 ? caption("Fifty times before lunch.", 176, 6) : null}
        </div>
      </AbsoluteFill>
    </>
  );
};

// ---------------------------------------------------------------- 5. matters withheld

const Withheld: React.FC<{ exitAt: number }> = ({ exitAt }) => {
  const frame = useCurrentFrame();
  const lines = [
    "From a standup where someone mentioned the migration is still running.",
    "From a review comment explaining why that function only looks stupid.",
    "From the face someone made when they suggested touching the payments service.",
    "From turning to the person next to them and asking.",
  ];
  const tops = [570, 680, 790, 900];
  const stampAt = 206;
  return (
    <World
      hits={[stampAt]}
      shots={[
        { at: 0, rect: { x: 60, y: 60, w: 880, h: 500 } },
        { at: 66, rect: { x: 60, y: 520, w: 880, h: 640 }, dur: 22 },
        { at: 196, rect: { x: 40, y: 440, w: 920, h: 880 }, dur: 16 },
      ]}
    >
      <Sfx at={0} name="paper-slide" />
      <Arriving exitAt={exitAt} seed={14}>
        <PartHeading section="AR-1 / Section 3 · Matters withheld" part="Part 3: What Thirty Seconds Rules Out" y={100} />
        <At x={110} y={380} w={800} style={serif(38)}>
          <Typed text="Most of what a new starter knows after three months, nobody ever told them. They picked it up sideways." at={14} cps={64} />
        </At>
        <div style={{ position: "absolute", left: 104, top: 560, width: 6, height: 450, background: P.ink, opacity: frame >= 72 ? 1 : 0 }} />
        {lines.map((l, i) => (
          <At key={i} x={140} y={tops[i]} w={740} style={serif(34, { opacity: frame >= 72 + i * 9 ? 1 : 0 })}>
            <span style={{ position: "relative", display: "inline-block" }}>
              {l}
              <Redaction at={150 + i * 9} />
            </span>
          </At>
        ))}
        <At x={110} y={1060} w={800} style={serif(46, { fontWeight: 600 })}>
          <Typed text="None of it is available." at={188} cps={40} />
        </At>
        <Stamp text="Tacit knowledge: not supplied" at={stampAt} x={500} y={1210} size={38} rotate={4} />
      </Arriving>
    </World>
  );
};

// ---------------------------------------------------------------- 6. so you blame the model

const Blame: React.FC<{ exitAt: number }> = ({ exitAt }) => {
  const excuses: [string, number][] = [
    ["It isn't clever enough.", 18],
    ["The other tool is better.", 40],
    ["Agents just make things up.", 62],
  ];
  const widths = [430, 470, 520];
  return (
    <World
      shots={[
        { at: 0, rect: { x: 60, y: 60, w: 880, h: 680 } },
        { at: 118, rect: { x: 60, y: 580, w: 880, h: 560 }, dur: 22 },
      ]}
    >
      <Sfx at={0} name="paper-slide" />
      <Arriving exitAt={exitAt} seed={21}>
        <PartHeading section="AR-1 / Section 4 · Complaints and representations" part="Part 4: So You Blame the Model" y={100} />
        {excuses.map(([t, at], i) => (
          <At key={t} x={110} y={390 + i * 90} w={800} style={serif(44)}>
            <Typed text={t} at={at} cps={44} />
            <Scribble at={98 + i * 7} x={-8} y={26} w={widths[i]} wavy width={6} />
            <Sfx at={98 + i * 7} name="biro" volume={0.7} />
          </At>
        ))}
        <At x={110} y={680} w={800} style={serif(44, { fontStyle: "italic" })}>
          <Typed text="Most of the time I don't think it's the model." at={124} cps={42} />
        </At>
        <At x={110} y={810} w={780} style={serif(50, { fontWeight: 600 })}>
          <Typed text="I think the repository couldn't induct anybody in thirty seconds, and it never could." at={160} cps={48} />
        </At>
        <Hand at={222} style={{ position: "absolute", left: 880, top: 700, fontSize: 64, transform: "rotate(-8deg)" }}>
          N.B.
        </Hand>
        <Sfx at={222} name="biro" volume={0.7} />
      </Arriving>
    </World>
  );
};

// ---------------------------------------------------------------- 7. the issue sheet

const ISSUE = [
  "Runs itself.",
  "Validates itself.",
  "Documents itself.",
  "Runs in isolation.",
  "Independent of third parties.",
  "Browser-testable.",
  "Knows its place in production.",
  "Knows how the team works.",
];

const Issue: React.FC<{ exitAt: number }> = ({ exitAt }) => {
  const frame = useCurrentFrame();
  const top = 400;
  const rowH = 96;
  return (
    <World
      shots={[
        { at: 0, rect: { x: 60, y: 60, w: 880, h: 420 } },
        { at: 44, rect: { x: 60, y: 340, w: 880, h: 920 }, dur: 30 },
      ]}
    >
      <Sfx at={0} name="paper-slide" />
      <Arriving exitAt={exitAt} seed={27}>
        <At x={110} y={100} style={{ fontFamily: F.serif, fontWeight: 600, fontSize: 64, textTransform: "uppercase" }}>
          Issue sheet
        </At>
        <At x={112} y={186}>
          <Label size={18}>For completion by the bearer</Label>
        </At>
        <At x={110} y={250} w={800} style={serif(42, { fontStyle: "italic" })}>
          <Typed text="What does this repository issue to whoever turns up?" at={14} cps={48} />
        </At>
        <At x={110} y={top} w={790} style={{ border: `4px solid ${P.ink}`, height: 66 + rowH * ISSUE.length }} />
        <At
          x={110}
          y={top}
          w={790}
          style={{ height: 66, background: P.oliveDeep, color: P.buff, fontFamily: F.mono, fontWeight: 700, fontSize: 20, letterSpacing: "0.2em", display: "flex", alignItems: "center" }}
        >
          <span style={{ paddingLeft: 24, flex: 1 }}>ITEM</span>
          <span style={{ width: 90, textAlign: "center" }}>QTY</span>
          <span style={{ width: 130, textAlign: "center" }}>ISSUED</span>
        </At>
        {ISSUE.map((item, i) => {
          const y = top + 66 + i * rowH;
          const appear = interpolate(frame, [50 + i * 3, 58 + i * 3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <React.Fragment key={item}>
              <At
                x={110}
                y={y}
                w={790}
                style={{
                  height: rowH,
                  borderTop: `2px solid ${P.khaki}`,
                  display: "flex",
                  alignItems: "center",
                  opacity: appear,
                  transform: `translateX(${(1 - appear) * 30}px)`,
                }}
              >
                <span style={{ fontFamily: F.mono, fontSize: 20, color: P.khakiText, paddingLeft: 24, width: 64 }}>{String(i + 1).padStart(2, "0")}</span>
                <span style={{ ...serif(36, { fontWeight: 600 }), flex: 1 }}>{item}</span>
                <span style={{ width: 90, textAlign: "center", fontFamily: F.mono, fontSize: 28, borderLeft: `2px solid ${P.khaki}`, lineHeight: `${rowH}px` }}>1</span>
                <span style={{ width: 130, display: "flex", justifyContent: "center", borderLeft: `2px solid ${P.khaki}`, height: rowH, alignItems: "center" }}>
                  <span style={{ width: 40, height: 40, border: `3px solid ${P.ink}` }} />
                </span>
              </At>
              <Tick at={92 + i * 11} x={830} y={y + 12} size={64} />
            </React.Fragment>
          );
        })}
      </Arriving>
    </World>
  );
};

// ---------------------------------------------------------------- 8. remarks on discharge

const Discharge: React.FC = () => {
  const frame = useCurrentFrame();
  const a = useArrival(0, "right", 0.6);
  const tearAt = 150;
  const tear = interpolate(frame, [tearAt, tearAt + 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.4)) });
  const topH = 880;
  return (
    <World
      hits={[112]}
      shots={[
        { at: 0, rect: { x: 60, y: 60, w: 880, h: 680 } },
        { at: 98, rect: { x: 40, y: 360, w: 920, h: 560 }, dur: 20 },
        { at: tearAt, rect: { x: -20, y: 880, w: 1040, h: 560 }, dur: 40 },
      ]}
    >
      <Sfx at={0} name="paper-slide" />
      <div style={{ position: "absolute", transform: `translate(${a.dx}px, ${a.dy}px) rotate(${a.rotate}deg)`, transformOrigin: "500px 670px" }}>
        <div style={{ position: "absolute", transform: `translateY(${-tear * 30}px) rotate(${-tear * 3}deg)`, }}>
          <Sheet seed={33} h={topH}>
            <At x={110} y={110}>
              <Label>AR-1 / Section 7 · Remarks on discharge</Label>
            </At>
            <At x={110} y={200} w={800} style={serif(86, { fontWeight: 600, lineHeight: 1.1 })}>
              <Typed text="Every session is day one." at={14} cps={30} />
            </At>
            <At x={110} y={440} w={790} style={serif(46)}>
              <Typed text="That isn't going to change, so it's worth making day one work." at={50} cps={46} />
            </At>
            <Stamp text="Returned to depot" at={112} x={580} y={720} size={58} rotate={-6} />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, borderBottom: `4px dashed ${P.khaki}` }} />
          </Sheet>
        </div>
        <div
          style={{
            position: "absolute",
            top: topH,
            transform: `translate(${tear * 20}px, ${tear * 70}px) rotate(${tear * 2.5}deg)`,
            transformOrigin: "0 0",
          }}
        >
          <Sheet seed={34} h={SHEET_H - topH} hole={false} shadow={1 + tear * 0.6}>
            <div style={{ position: "absolute", left: 0, right: 0, top: 0, borderTop: `4px dashed ${P.khaki}` }} />
            <At x={60} y={30} w={880} style={{ display: "flex", justifyContent: "space-between" }}>
              <Label size={18}>&#9986; Detach and retain</Label>
              <Label size={18}>AR-1</Label>
            </At>
            <At x={60} y={110} w={880} style={{ fontFamily: F.stencil, fontWeight: 700, fontSize: 92, lineHeight: 1 }}>
              MARCOMARK.CO.UK
            </At>
            <At x={60} y={230} w={880} style={serif(44, { fontStyle: "italic", fontWeight: 600 })}>
              Every Session Is Day One
            </At>
            <At x={60} y={310} w={880} style={{ fontFamily: F.mono, fontSize: 22, letterSpacing: "0.2em", color: P.khakiText }}>
              OPINION. 7 SEPTEMBER 2026. MARCO MARK.
            </At>
          </Sheet>
        </div>
      </div>
      <Sfx at={tearAt} name="tear" />
    </World>
  );
};

// ---------------------------------------------------------------- the running order

const OVERLAP = 16;
const SCENES: { C: React.FC<{ exitAt: number }>; dur: number }[] = [
  { C: Record, dur: 250 },
  { C: Ritual, dur: 236 },
  { C: Compression, dur: 180 },
  { C: Fifty, dur: 262 },
  { C: Withheld, dur: 250 },
  { C: Blame, dur: 262 },
  { C: Issue, dur: 220 },
  { C: Discharge as React.FC<{ exitAt: number }>, dur: 250 },
];

const starts = SCENES.reduce<number[]>((acc, s, i) => [...acc, i === 0 ? 0 : acc[i - 1] + SCENES[i - 1].dur - OVERLAP], []);
export const DAY_ONE_FRAMES = starts[starts.length - 1] + SCENES[SCENES.length - 1].dur;

const FilmGrain: React.FC = () => {
  const frame = useCurrentFrame();
  return <Grain opacity={0.08} texture={`film-${(frame * 7) % 6}`} blend="overlay" />;
};

export const DayOne: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeOut = interpolate(frame, [DAY_ONE_FRAMES - 30, DAY_ONE_FRAMES], [0.45, 0], { extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill style={{ background: P.oliveDeep }}>
      <Desk />
      <Audio src={staticFile("sfx/room.wav")} loop volume={fadeOut} />
      {SCENES.map(({ C, dur }, i) => (
        <Sequence key={i} from={starts[i]} durationInFrames={dur}>
          <C exitAt={dur - OVERLAP} />
        </Sequence>
      ))}
      <Banner position="top" text="RESTRICTED · TRAINING & INDUCTION · DESTROY WHEN COMPLETE" />
      <Banner position="bottom" text="RESTRICTED · RETURN TO ORDERLY ROOM ON COMPLETION" />
      <FilmGrain />
    </AbsoluteFill>
  );
};
