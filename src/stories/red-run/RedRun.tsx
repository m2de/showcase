import React from "react";
import { AbsoluteFill, Easing, interpolate, random, Sequence, useCurrentFrame } from "remotion";
import { cells } from "../../brand/mark";
import { Agent, Caption, Cell, clampOpts, CodeCard, Door, F, k, Mono, P, pop, Sfx, useView } from "./look";

// The One Red Run, from marcomark.co.uk/blog/the-one-red-run.html. People are asking their agent how
// many times their tests caught a bug, which nobody ever counted before AI. Tests are there for the
// one time something breaks, so the count can't tell a useless test from a guard, points at the
// brittle ones, and mostly measures how often the agent broke things. Better: break it on purpose.
// Told with the post's own picture, a run history of green squares and one red one.

const SCENES = [
  ["prompt", 150],
  ["history", 300],
  ["quiet", 250],
  ["brittle", 180],
  ["five", 190],
  ["purpose", 230],
  ["end", 180],
] as const;

export const RED_RUN_FRAMES = SCENES.reduce((n, [, d]) => n + d, 0);

const starts = SCENES.reduce<number[]>((acc, [, d], i) => [...acc, i === 0 ? 0 : acc[i - 1] + SCENES[i - 1][1]], []);
const at = (name: (typeof SCENES)[number][0]) => starts[SCENES.findIndex(([n]) => n === name)];

// Each scene fades up from paper and back down to it.
const Fade: React.FC<{ d: number; children: React.ReactNode; cutIn?: boolean }> = ({ d, children, cutIn }) => {
  const f = useCurrentFrame();
  const a = interpolate(f, cutIn ? [0, 1, d - 8, d] : [0, 8, d - 8, d], [cutIn ? 1 : 0, 1, 1, 0], clampOpts);
  return <AbsoluteFill style={{ opacity: a }}>{children}</AbsoluteFill>;
};

// ---------------------------------------------------------------- 1. the prompt

const PROMPT = "How many times did a test catch a bug?";

const Prompt: React.FC = () => {
  const f = useCurrentFrame();
  const { w, h, vertical } = useView();
  const typed = Math.round(k(f, [4, 40], [0, PROMPT.length], Easing.linear));
  const cardW = vertical ? w * 0.84 : w * 0.56;
  const cardY = vertical ? h * 0.25 : h * 0.24;
  const size = vertical ? 46 : 38;
  const five = pop(f, 58, 14);
  const caret = f % 16 < 9 && f < 44;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: (w - cardW) / 2,
          top: cardY,
          width: cardW,
          transform: `translateY(-50%) scale(${k(f, [0, 10], [0.96, 1])})`,
          background: P.card,
          border: `2px solid ${P.rule}`,
          borderRadius: 18,
          padding: vertical ? "40px 44px" : "34px 40px",
          boxSizing: "border-box",
        }}
      >
        <Mono size={vertical ? 26 : 22} style={{ marginBottom: 18 }}>
          you
        </Mono>
        <Mono size={size} colour={P.ink} style={{ minHeight: size * 1.35 * (vertical ? 2 : 1) }}>
          {PROMPT.slice(0, typed)}
          <span style={{ opacity: caret ? 1 : 0, color: P.pass }}>▍</span>
        </Mono>
        <Mono size={size} colour={P.pass} style={{ marginTop: 22, fontWeight: 700, opacity: f >= 50 ? 1 : 0 }}>
          {"> Found 5."}
        </Mono>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          width: w,
          top: vertical ? h * 0.48 : h * 0.56,
          transform: `translateY(-50%) scale(${0.4 + five * 0.6})`,
          opacity: Math.min(1, five * 2) * k(f, [118, 140], [1, 0.25]),
          textAlign: "center",
          fontFamily: F.sans,
          fontWeight: 800,
          fontSize: vertical ? 560 : 380,
          lineHeight: 1,
          letterSpacing: "-0.06em",
          color: P.pass,
        }}
      >
        5
      </div>
      {Array.from({ length: 4 }, (_, i) => (
        <Sfx key={i} at={6 + i * 9} name={`key-${i % 4}`} volume={0.5} dur={6} />
      ))}
      <Sfx at={50} name="red-run/blip" volume={0.6} />
      <Sfx at={58} name="red-run/knock" volume={0.5} />
      <Caption text="Who ever counted that before AI?" from={78} to={148} hot="before AI" hotColour={P.pass} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 2. the run history

const useGrid = () => {
  const { w, vertical } = useView();
  const cols = vertical ? 32 : 48;
  const rows = vertical ? 33 : 22;
  const pitch = vertical ? 28 : 29;
  const left = (w - cols * pitch) / 2;
  const top = vertical ? 340 : 172;
  const red = vertical ? 24 * cols + 22 : 15 * cols + 31;
  return { cols, rows, pitch, left, top, red, n: cols * rows };
};

const FILL_FROM = 8;
const FILL_FOR = 150;
const RED_AT = 172;

const History: React.FC = () => {
  const f = useCurrentFrame();
  const { vertical } = useView();
  const g = useGrid();
  const greens = g.n - 1;
  // Runs arrive slowly, then in a blur: rank r appears at FILL_FOR * (r / greens) ^ 0.4.
  const shown = Math.min(greens, Math.floor(greens * Math.pow(Math.max(0, f - FILL_FROM) / FILL_FOR, 2.5)));
  const dim = k(f, [190, 212], [1, 0.13]);
  const red = k(f, [RED_AT, RED_AT + 10], [0, 1], Easing.out(Easing.back(2.2)));
  const throb = 1 + 0.7 * Math.max(0, Math.sin(((f - 214) / 22) * Math.PI)) * (f > 214 && f < 258 ? 1 : 0);
  const shake = f >= RED_AT && f < RED_AT + 12 ? Math.sin(f * 2.7) * k(f, [RED_AT, RED_AT + 12], [10, 0]) : 0;
  const cell = g.pitch * 0.82;
  const items: React.ReactNode[] = [];
  let rank = 0;
  for (let i = 0; i < g.n; i++) {
    const x = g.left + (i % g.cols) * g.pitch + g.pitch / 2;
    const y = g.top + Math.floor(i / g.cols) * g.pitch + g.pitch / 2;
    if (i === g.red) continue;
    if (rank >= shown) break;
    const born = FILL_FROM + FILL_FOR * Math.pow(rank / greens, 0.4);
    items.push(<Cell key={i} x={x} y={y} size={cell} scale={k(f, [born, born + 5], [0.2, 1], Easing.out(Easing.back(2)))} opacity={dim} />);
    rank++;
  }
  const rx = g.left + (g.red % g.cols) * g.pitch + g.pitch / 2;
  const ry = g.top + Math.floor(g.red / g.cols) * g.pitch + g.pitch / 2;
  const caught = f >= RED_AT ? 1 : 0;
  return (
    <AbsoluteFill style={{ transform: `translateX(${shake}px)` }}>
      <div style={{ position: "absolute", left: g.left, top: g.top - (vertical ? 66 : 54), width: g.cols * g.pitch, display: "flex", justifyContent: "space-between" }}>
        <Mono size={vertical ? 30 : 26} colour={P.pass} style={{ fontWeight: 700 }}>
          {`passed ${shown.toLocaleString("en-GB")}`}
        </Mono>
        <Mono size={vertical ? 30 : 26} colour={caught ? P.fail : P.muted} style={{ fontWeight: 700 }}>
          {`caught a bug ${caught}`}
        </Mono>
      </div>
      {items}
      {red > 0 ? <Cell x={rx} y={ry} size={cell} colour={P.fail} scale={(3.2 - 2.2 * red) * throb} opacity={Math.min(1, red * 3)} /> : null}
      <Sfx at={FILL_FROM} name="red-run/fill" volume={0.55} dur={160} />
      <Sfx at={RED_AT} name="red-run/thud" volume={0.9} />
      <Caption text="Nobody bothered." from={40} to={130} />
      <Caption text="It only needs to go red once." from={206} to={296} hot="red" />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 3. two quiet tests

const BUTTON_Y = (vertical: boolean, h: number) => (vertical ? h * 0.56 : h * 0.705);

const Quiet: React.FC = () => {
  const f = useCurrentFrame();
  const { w, h, vertical, u } = useView();
  const cols = [w * (vertical ? 0.27 : 0.3), w * (vertical ? 0.73 : 0.7)];
  const sq = 14 * u;
  const sqY = h * (vertical ? 0.19 : 0.2);
  const boxW = vertical ? 36 * u : 28 * u;
  const boxH = 16 * u;
  const boxY = vertical ? h * 0.355 : h * 0.47;
  const mx = sq * (vertical ? 1.25 : 1.6);
  const reveal = k(f, [96, 124], [0, 1]);
  const line = k(f, [92, 110], [0, 1]);
  // The cursor drags a box round both tests, then heads for the button.
  const curX = f < 176 ? k(f, [136, 150, 172], [w * 0.5, cols[0] - mx, cols[1] + mx]) : k(f, [182, 206], [cols[1] + mx, w * 0.5 + 40]);
  const curY = f < 176 ? k(f, [136, 150, 172], [h * 0.9, sqY - sq * 0.75, sqY + sq * 1.25]) : k(f, [182, 206], [sqY + sq * 1.25, BUTTON_Y(vertical, h) + 20]);
  const marquee = f >= 150 ? { x0: cols[0] - mx, y0: sqY - sq * 0.75, x1: f < 176 ? curX : cols[1] + mx, y1: f < 176 ? curY : sqY + sq * 1.25 } : null;
  const button = pop(f, 176, 12);
  const hover = f >= 206;
  const warn = f > 212 ? 0.5 + 0.5 * Math.sin((f - 212) / 4) : 0;
  const labels = ["guarding nothing", "guarding code nobody's touched yet"];
  return (
    <AbsoluteFill>
      {cols.map((x, i) => (
        <React.Fragment key={i}>
          <Cell x={x} y={sqY} size={sq} scale={pop(f, 4 + i * 6)} />
          <Mono size={vertical ? 30 : 26} style={{ position: "absolute", left: x - 200, width: 400, textAlign: "center", top: sqY + sq * 0.62, opacity: k(f, [18, 28], [0, 1]) }}>
            0 catches
          </Mono>
          <div
            style={{
              position: "absolute",
              left: x - 1.5,
              top: sqY + sq * 0.62 + (vertical ? 52 : 46),
              width: 3,
              height: (boxY - boxH / 2 - (sqY + sq * 0.62 + (vertical ? 52 : 46)) - 16) * line,
              backgroundImage: `linear-gradient(${P.muted} 50%, transparent 50%)`,
              backgroundSize: "3px 14px",
            }}
          />
          {i === 0 ? (
            <div
              style={{
                position: "absolute",
                left: x - boxW / 2,
                top: boxY - boxH / 2,
                width: boxW,
                height: boxH,
                border: `3px dashed ${P.rule}`,
                borderRadius: u * 0.8,
                boxSizing: "border-box",
                opacity: reveal,
                transform: `translateY(${(1 - reveal) * 20}px)`,
              }}
            />
          ) : (
            <CodeCard x={x} y={boxY + (1 - reveal) * 20} w={boxW} h={boxH} seed="old" lines={5} opacity={reveal} outline={warn ? `rgba(225,10,35,${0.25 + warn * 0.75})` : P.rule} />
          )}
          <Mono
            size={vertical ? 30 : 26}
            colour={P.ink}
            style={{ position: "absolute", left: x - boxW / 2 - 20, width: boxW + 40, textAlign: "center", top: boxY + boxH / 2 + 22, opacity: k(f, [112, 126], [0, 1]) }}
          >
            {labels[i]}
          </Mono>
        </React.Fragment>
      ))}
      {marquee ? (
        <div
          style={{
            position: "absolute",
            left: Math.min(marquee.x0, marquee.x1),
            top: Math.min(marquee.y0, marquee.y1),
            width: Math.abs(marquee.x1 - marquee.x0),
            height: Math.abs(marquee.y1 - marquee.y0),
            border: `2px solid ${P.ink}`,
            background: "rgba(18,18,18,0.04)",
            borderRadius: 6,
            opacity: k(f, [226, 236], [1, 0.4]),
          }}
        />
      ) : null}
      {button > 0 ? (
        <div
          style={{
            position: "absolute",
            left: w / 2,
            top: BUTTON_Y(vertical, h),
            transform: `translate(-50%, -50%) scale(${button})`,
            background: hover ? "#b8081c" : P.fail,
            color: "#fff",
            fontFamily: F.mono,
            fontWeight: 700,
            fontSize: vertical ? 30 : 26,
            padding: vertical ? "22px 34px" : "18px 30px",
            borderRadius: 12,
            whiteSpace: "nowrap",
          }}
        >
          Delete 2 tests that never caught anything
        </div>
      ) : null}
      {f >= 136 ? (
        <svg viewBox="0 0 24 24" style={{ position: "absolute", left: curX - 4, top: curY - 2, width: 46, height: 46, opacity: k(f, [136, 142], [0, 1]) }}>
          <path d="M3 2 L3 20 L8 15.5 L11.5 22.5 L14.5 21 L11 14 L18 14 Z" fill={P.ink} stroke={P.paper} strokeWidth={1.4} strokeLinejoin="round" />
        </svg>
      ) : null}
      <Sfx at={4} name="red-run/blip" volume={0.5} />
      <Sfx at={10} name="red-run/blip" volume={0.5} />
      <Sfx at={150} name="red-run/click" volume={0.8} />
      <Sfx at={206} name="red-run/click" volume={0.5} />
      <Caption text="Two tests. Never gone red." from={10} to={92} />
      <Caption text="The count can't tell them apart." from={134} to={246} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 4. the brittle one

const REFACTORS = [22, 56, 90, 124];
const ORDERS = [
  [0, 1, 2, 3, 4],
  [0, 3, 1, 4, 2],
  [0, 2, 4, 1, 3],
  [0, 4, 3, 2, 1],
  [0, 1, 3, 2, 4],
];

const Brittle: React.FC = () => {
  const f = useCurrentFrame();
  const { w, h, vertical, u } = useView();
  const done = REFACTORS.filter((r) => f >= r).length;
  const last = done ? REFACTORS[done - 1] : -100;
  const shuffle = k(f, [last, last + 12], [0, 1]);
  const prev = ORDERS[Math.max(0, done - 1)];
  const next = ORDERS[Math.max(0, done)];
  const isRed = f >= last + 6 && f < last + 22;
  const card = { x: vertical ? w / 2 : w * 0.38, y: vertical ? h * 0.25 : h * 0.4, w: vertical ? 62 * u : 50 * u, h: vertical ? 34 * u : 34 * u };
  const test = { x: vertical ? w / 2 : w * 0.72, y: vertical ? h * 0.5 : h * 0.4 };
  const sq = 15 * u;
  return (
    <AbsoluteFill>
      <CodeCard x={card.x} y={card.y} w={card.w} h={card.h} seed="brittle" lines={5} from={prev} order={next} shuffle={done ? shuffle : 0} />
      <Mono
        size={vertical ? 30 : 26}
        colour={P.muted}
        style={{ position: "absolute", left: card.x - card.w / 2, top: card.y + card.h / 2 + 22, width: card.w, textAlign: "center" }}
      >
        {done ? `refactor ${done}` : "the code"}
        {done ? <span style={{ color: P.pass, fontWeight: 700, opacity: f > last + 12 ? 1 : 0 }}>{"  ✓ still works"}</span> : null}
      </Mono>
      <div
        style={{
          position: "absolute",
          left: vertical ? test.x - 1.5 : card.x + card.w / 2 + 20,
          top: vertical ? card.y + card.h / 2 + 80 : test.y - 1.5,
          width: vertical ? 3 : test.x - sq / 2 - (card.x + card.w / 2) - 40,
          height: vertical ? test.y - sq / 2 - (card.y + card.h / 2 + 80) - 20 : 3,
          backgroundImage: vertical ? `linear-gradient(${P.rule} 50%, transparent 50%)` : `linear-gradient(90deg, ${P.rule} 50%, transparent 50%)`,
          backgroundSize: vertical ? "3px 14px" : "14px 3px",
        }}
      />
      <Cell x={test.x} y={test.y} size={sq} colour={isRed ? P.fail : P.pass} scale={pop(f, 2) * (isRed ? 1.08 : 1)} />
      <Mono
        size={vertical ? 30 : 26}
        colour={done ? P.fail : P.muted}
        style={{ position: "absolute", left: test.x - 200, width: 400, textAlign: "center", top: test.y + sq / 2 + 22, fontWeight: 700 }}
      >
        {`caught ${done}`}
      </Mono>
      {REFACTORS.map((r) => (
        <React.Fragment key={r}>
          <Sfx at={r} name="red-run/knock" volume={0.35} />
          <Sfx at={r + 6} name="red-run/flick" volume={0.7} />
        </React.Fragment>
      ))}
      <Caption text="Goes red every refactor." from={14} to={92} hot="red" />
      <Caption text="Nothing was actually broken." from={98} to={176} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 5. the five

const HITS = [30, 52, 74, 96, 118];

const useRow = (count: number) => {
  const { w, h, vertical, u } = useView();
  const bw = vertical ? 15 * u : 17 * u;
  const gap = vertical ? 3.2 * u : 6 * u;
  const total = count * bw + (count - 1) * gap;
  const xs = Array.from({ length: count }, (_, i) => (w - total) / 2 + bw / 2 + i * (bw + gap));
  return { xs, bw, bh: bw * 0.72, y: vertical ? h * 0.36 : h * 0.44, testY: vertical ? h * 0.48 : h * 0.66, sq: (vertical ? 7 : 7) * u, u };
};

// The agent hops from block to block; hitting block i at time hits[i].
const hop = (f: number, hits: number[], xs: number[], startX: number) => {
  const times = [hits[0] - 20, ...hits];
  const pos = [startX, ...xs];
  let x = pos[0];
  let lift = 0;
  for (let i = 0; i < times.length - 1; i++) {
    if (f >= times[i] && f < times[i + 1]) {
      const p = (f - times[i]) / (times[i + 1] - times[i]);
      x = interpolate(p, [0, 1], [pos[i], pos[i + 1]], { easing: Easing.inOut(Easing.quad) });
      lift = Math.sin(p * Math.PI);
    }
  }
  if (f >= times[times.length - 1]) x = pos[pos.length - 1];
  return { x, lift };
};

const Five: React.FC = () => {
  const f = useCurrentFrame();
  const { w, h, vertical } = useView();
  const row = useRow(5);
  const { x: ax, lift } = hop(f, HITS, row.xs, Math.max(row.xs[0] - row.bw * 1.4, row.bw * 0.5));
  const caught = HITS.filter((t) => f >= t + 4).length;
  const agentSize = row.bw * 0.42;
  const big = k(f, [128, 146], [0, 1]);
  return (
    <AbsoluteFill>
      {row.xs.map((x, i) => {
        const hit = HITS[i];
        const knocked = f >= hit && f < hit + 16;
        const wob = knocked ? Math.sin((f - hit) * 0.9) * k(f, [hit, hit + 16], [14, 0]) : 0;
        return (
          <React.Fragment key={i}>
            <CodeCard x={x} y={row.y} w={row.bw} h={row.bh} seed={`five-${i}`} lines={3} rotate={wob} outline={knocked ? P.fail : P.rule} scale={pop(f, i * 3, 10)} />
            <Cell x={x} y={row.testY} size={row.sq} colour={f >= hit + 4 && f < hit + 20 ? P.fail : P.pass} scale={pop(f, 6 + i * 3, 10)} />
          </React.Fragment>
        );
      })}
      <Agent x={ax} y={row.y - row.bh / 2 - agentSize / 2 - lift * row.bh * 0.5} size={agentSize} squash={lift < 0.15 && f > HITS[0] - 4 ? 0.4 : 0} opacity={k(f, [6, 14], [0, 1])} />
      <div
        style={{
          position: "absolute",
          left: 0,
          width: w,
          top: vertical ? h * 0.14 : h * 0.1,
          textAlign: "center",
          fontFamily: F.sans,
          fontWeight: 800,
          fontSize: (vertical ? 120 : 96) + big * (vertical ? 80 : 50),
          letterSpacing: "-0.05em",
          lineHeight: 1,
          color: caught ? P.fail : P.muted,
        }}
      >
        {caught}
        <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: vertical ? 30 : 26, letterSpacing: "0.01em", marginLeft: 16, color: P.muted }}>caught</span>
      </div>
      {HITS.map((t) => (
        <React.Fragment key={t}>
          <Sfx at={t} name="red-run/knock" volume={0.5} />
          <Sfx at={t + 4} name="red-run/flick" volume={0.55} />
        </React.Fragment>
      ))}
      <Caption text="So those 5 catches?" from={18} to={104} />
      <Caption text="That's the agent breaking stuff." from={112} to={186} hot="the agent" />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 6. break it on purpose

const SMASH = [40, 66, 92, 118];

const Purpose: React.FC = () => {
  const f = useCurrentFrame();
  const { vertical } = useView();
  const row = useRow(4);
  const { x: ax, lift } = hop(f, SMASH, row.xs, row.xs[0] - row.bw * 1.4);
  const agentSize = row.bw * 0.42;
  const puzzled = f > 132 && f < 176;
  const written = pop(f, 182, 14);
  const slotPulse = f > 140 && f < 182 ? 0.5 + 0.5 * Math.sin((f - 140) / 3.5) : 0;
  return (
    <AbsoluteFill>
      {row.xs.map((x, i) => {
        const t = SMASH[i];
        const crack = k(f, [t, t + 8], [0, 1]);
        const fixed = f > 200;
        const red = i < 3 && f >= t + 4;
        return (
          <React.Fragment key={i}>
            <CodeCard
              x={x}
              y={row.y + (f >= t && f < t + 6 ? 6 : 0)}
              w={row.bw}
              h={row.bh}
              seed={`purpose-${i}`}
              lines={3}
              outline={crack > 0 && !fixed ? P.fail : P.rule}
              crack={fixed ? 0 : crack}
              scale={pop(f, i * 3, 10)}
            />
            {i < 3 ? (
              <Cell x={x} y={row.testY} size={row.sq} colour={red && !fixed ? P.fail : P.pass} scale={pop(f, 6 + i * 3, 10)} />
            ) : (
              <>
                <div
                  style={{
                    position: "absolute",
                    left: x - row.sq / 2,
                    top: row.testY - row.sq / 2,
                    width: row.sq,
                    height: row.sq,
                    border: `3px dashed ${slotPulse ? `rgba(225,10,35,${0.3 + slotPulse * 0.7})` : P.rule}`,
                    borderRadius: row.sq * 0.15,
                    boxSizing: "border-box",
                    opacity: pop(f, 15, 10) * (1 - written),
                  }}
                />
                {written > 0 ? <Cell x={x} y={row.testY - (1 - written) * 60} size={row.sq} scale={written} /> : null}
              </>
            )}
          </React.Fragment>
        );
      })}
      <Agent x={ax} y={row.y - row.bh / 2 - agentSize / 2 - lift * row.bh * 0.5} size={agentSize} squash={lift < 0.15 && f > SMASH[0] - 4 && f < 130 ? 0.4 : 0} look={puzzled ? -0.6 : 1} opacity={k(f, [6, 14], [0, 1])} />
      {puzzled ? (
        <div
          style={{
            position: "absolute",
            left: ax + agentSize * 0.3,
            top: row.y - row.bh / 2 - agentSize * 2.4 + Math.sin(f / 5) * 4,
            fontFamily: F.sans,
            fontWeight: 800,
            fontSize: vertical ? 80 : 70,
            color: P.fail,
            opacity: k(f, [132, 140], [0, 1]) * k(f, [168, 176], [1, 0]),
          }}
        >
          ?
        </div>
      ) : null}
      {SMASH.map((t, i) => (
        <React.Fragment key={t}>
          <Sfx at={t} name="red-run/knock" volume={0.6} />
          {i < 3 ? <Sfx at={t + 4} name="red-run/flick" volume={0.55} /> : null}
        </React.Fragment>
      ))}
      <Sfx at={182} name="red-run/blip" volume={0.7} />
      <Caption text="Break it on purpose." from={12} to={124} hot="on purpose" />
      <Caption text="Nothing goes red? That's your next test." from={134} to={226} hot="red" />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 7. the end card

const End: React.FC = () => {
  const f = useCurrentFrame();
  const { w, h, vertical } = useView();
  const pitch = vertical ? 62 : 70;
  const mw = 14 * pitch;
  const left = (w - mw) / 2;
  const top = vertical ? h * 0.27 : h * 0.14;
  const m = cells("1");
  const sq = cells("2");
  const sqLeft = Math.min(...sq.map((c) => c.x));
  const sqTop = Math.min(...sq.map((c) => c.y));
  const red = k(f, [58, 70], [0, 1], Easing.out(Easing.back(1.8)));
  const title = k(f, [76, 90], [0, 1]);
  return (
    <AbsoluteFill>
      {m.map((c, i) => {
        const delay = random(`d${i}`) * 26;
        const p = k(f, [delay, delay + 26], [0, 1], Easing.inOut(Easing.cubic));
        const sx = random(`x${i}`) * w;
        const sy = random(`y${i}`) * h;
        const x = interpolate(p, [0, 1], [sx, left + c.x * pitch + pitch / 2]);
        const y = interpolate(p, [0, 1], [sy, top + c.y * pitch + pitch / 2]);
        const size = interpolate(p, [0, 1], [pitch * 0.5, pitch]);
        const colour = p > 0.98 ? P.ink : P.pass;
        return <Cell key={i} x={x} y={y} size={size + 0.5} colour={colour} opacity={k(f, [delay, delay + 4], [0, 1])} style={{ borderRadius: p > 0.98 ? 0 : size * 0.15 }} />;
      })}
      {red > 0 ? (
        <div
          style={{
            position: "absolute",
            left: left + sqLeft * pitch,
            top: top + sqTop * pitch,
            width: pitch * 2,
            height: pitch * 2,
            background: P.fail,
            transform: `scale(${3 - 2 * red})`,
            opacity: Math.min(1, red * 3),
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 0,
          width: w,
          top: top + 7 * pitch + (vertical ? 110 : 70),
          textAlign: "center",
          fontFamily: F.sans,
          fontWeight: 800,
          fontSize: vertical ? 110 : 96,
          letterSpacing: "-0.045em",
          lineHeight: 1,
          color: P.ink,
          opacity: title,
          transform: `translateY(${(1 - title) * 14}px)`,
        }}
      >
        The One <span style={{ color: P.fail }}>Red</span> Run
      </div>
      <Mono
        size={vertical ? 34 : 30}
        colour={P.muted}
        style={{ position: "absolute", left: 0, width: w, textAlign: "center", top: top + 7 * pitch + (vertical ? 270 : 200), opacity: k(f, [92, 104], [0, 1]) }}
      >
        marcomark.co.uk/blog
      </Mono>
      <Sfx at={0} name="red-run/whoosh" volume={0.6} />
      <Sfx at={58} name="red-run/thud" volume={0.8} />
      <Sfx at={84} name="red-run/chime" volume={0.6} dur={90} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- the clip

const SCENE_COMPONENTS: Record<(typeof SCENES)[number][0], React.FC> = {
  prompt: Prompt,
  history: History,
  quiet: Quiet,
  brittle: Brittle,
  five: Five,
  purpose: Purpose,
  end: End,
};

export const RedRun: React.FC = () => {
  const frame = useCurrentFrame();
  const { vertical } = useView();
  const endAt = at("end");
  return (
    <AbsoluteFill style={{ background: P.paper, overflow: "hidden" }}>
      {SCENES.map(([name, d]) => {
        const Scene = SCENE_COMPONENTS[name];
        return (
          <Sequence key={name} from={at(name)} durationInFrames={d} layout="none">
            <Fade d={name === "end" ? d + 20 : d} cutIn={name === "prompt"}>
              <Scene />
            </Fade>
          </Sequence>
        );
      })}
      <Mono
        size={vertical ? 26 : 22}
        colour={P.muted}
        style={{ position: "absolute", left: vertical ? 70 : 90, top: vertical ? 112 : 66, letterSpacing: "0.04em", opacity: k(frame, [endAt, endAt + 16], [1, 0]) }}
      >
        $ npm test
      </Mono>
      <Door opacity={k(frame, [endAt, endAt + 16], [1, 0])} />
    </AbsoluteFill>
  );
};
