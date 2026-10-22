import React from "react";
import { Audio, continueRender, delayRender, Easing, interpolate, random, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { MARK } from "../../brand/mark";

// The look of The One Red Run (marcomark.co.uk/blog/the-one-red-run.html): a test run history on
// paper. Ink, a green square for every run that passed and one red one. Inter Tight over JetBrains Mono.

export const P = {
  paper: "#f4f3ef",
  card: "#fbfaf7",
  ink: "#121212",
  muted: "#55554f",
  rule: "#d9d7cf",
  pass: "#2A8456",
  fail: "#E10A23",
};

export const F = {
  sans: "Inter Tight",
  mono: "JetBrains Mono",
};

const FONTS: [string, string, string][] = [
  [F.sans, "inter-tight/inter-tight-latin-500-normal.woff2", "500"],
  [F.sans, "inter-tight/inter-tight-latin-800-normal.woff2", "800"],
  [F.mono, "jetbrains-mono/jetbrains-mono-latin-400-normal.woff2", "400"],
  [F.mono, "jetbrains-mono/jetbrains-mono-latin-700-normal.woff2", "700"],
];

const fontHandle = delayRender("Loading red run fonts");
Promise.all(
  FONTS.map(([family, file, weight]) =>
    new FontFace(family, `url(${staticFile(`fonts/${file}`)})`, { weight }).load().then((f) => document.fonts.add(f)),
  ),
).then(() => continueRender(fontHandle));

export const clampOpts = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const k = (t: number, at: number[], v: number[], ease = Easing.inOut(Easing.cubic)) => interpolate(t, at, v, { ...clampOpts, easing: ease });
export const pop = (t: number, at: number, dur = 12) => k(t, [at, at + dur], [0, 1], Easing.out(Easing.back(1.8)));

// u is a hundredth of the short side, so 1080 either way round.
export const useView = () => {
  const { width, height } = useVideoConfig();
  const vertical = height > width;
  return { w: width, h: height, vertical, u: Math.min(width, height) / 100 };
};

export const Sfx: React.FC<{ at: number; name: string; volume?: number; dur?: number }> = ({ at, name, volume = 1, dur }) => (
  <Sequence from={Math.max(0, Math.round(at))} durationInFrames={dur ?? 60} layout="none">
    <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
  </Sequence>
);

// One test run.
export const Cell: React.FC<{ x: number; y: number; size: number; colour?: string; scale?: number; opacity?: number; style?: React.CSSProperties }> = ({
  x,
  y,
  size,
  colour = P.pass,
  scale = 1,
  opacity = 1,
  style,
}) => (
  <div
    style={{
      position: "absolute",
      left: x - size / 2,
      top: y - size / 2,
      width: size,
      height: size,
      borderRadius: size * 0.15,
      background: colour,
      transform: `scale(${scale})`,
      opacity,
      ...style,
    }}
  />
);

// A card of code: a few lines of different lengths, nothing legible.
export const CodeCard: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  seed: string;
  lines?: number;
  order?: number[];
  from?: number[];
  shuffle?: number;
  outline?: string;
  rotate?: number;
  opacity?: number;
  scale?: number;
  crack?: number;
}> = ({ x, y, w, h, seed, lines = 4, order, from: was, shuffle = 1, outline = P.rule, rotate = 0, opacity = 1, scale = 1, crack = 0 }) => {
  const { u } = useView();
  const pad = Math.min(w, h) * 0.16;
  const gap = (h - pad * 2) / lines;
  const from = Array.from({ length: lines }, (_, i) => i);
  const to = order ?? from;
  const before = was ?? from;
  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        background: P.card,
        border: `${Math.max(2, u * 0.25)}px solid ${outline}`,
        borderRadius: u * 0.8,
        transform: `rotate(${rotate}deg) scale(${scale})`,
        opacity,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {from.map((i) => {
        const slot = interpolate(shuffle, [0, 1], [before.indexOf(i), to.indexOf(i)]);
        const len = 0.3 + random(`${seed}-${i}`) * 0.55;
        const indent = random(`${seed}-in-${i}`) > 0.55 ? 1 : 0;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: pad + indent * pad,
              top: pad + slot * gap + gap * 0.3,
              width: (w - pad * 3) * len,
              height: Math.max(4, gap * 0.36),
              borderRadius: gap,
              background: i === 0 ? P.pass : P.ink,
              opacity: i === 0 ? 0.8 : 0.22,
            }}
          />
        );
      })}
      {crack > 0 ? (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <polyline
            points="54,0 46,28 60,44 42,66 55,82 48,100"
            fill="none"
            stroke={P.fail}
            strokeWidth={3.5}
            vectorEffect="non-scaling-stroke"
            strokeDasharray={140}
            strokeDashoffset={140 * (1 - crack)}
            style={{ strokeWidth: Math.max(3, u * 0.4) }}
          />
        </svg>
      ) : null}
    </div>
  );
};

// The agent: an ink block with eyes. It looks where it's going.
export const Agent: React.FC<{ x: number; y: number; size: number; look?: number; squash?: number; opacity?: number }> = ({ x, y, size, look = 1, squash = 0, opacity = 1 }) => {
  const frame = useCurrentFrame();
  const blink = frame % 70 > 66 ? 0.15 : 1;
  const eye = size * 0.14;
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        background: P.ink,
        borderRadius: size * 0.22,
        transform: `scale(${1 + squash * 0.25}, ${1 - squash * 0.25})`,
        transformOrigin: "50% 100%",
        opacity,
      }}
    >
      {[0.36, 0.64].map((ex) => (
        <div
          key={ex}
          style={{
            position: "absolute",
            left: size * ex - eye / 2 + look * size * 0.08,
            top: size * 0.36,
            width: eye,
            height: eye * 1.4 * blink,
            borderRadius: eye,
            background: P.paper,
          }}
        />
      ))}
    </div>
  );
};

export const Caption: React.FC<{ text: string; from: number; to: number; hot?: string; hotColour?: string }> = ({ text, from, to, hot, hotColour = P.fail }) => {
  const frame = useCurrentFrame();
  const { vertical, w, h } = useView();
  if (frame < from || frame > to) return null;
  const a = interpolate(frame, [from, from + 7, to - 7, to], [0, 1, 1, 0], clampOpts);
  const parts = hot ? text.split(hot) : [text];
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        width: w,
        top: vertical ? h * 0.705 : h * 0.815,
        textAlign: "center",
        fontFamily: F.sans,
        fontWeight: 800,
        fontSize: vertical ? 82 : 70,
        letterSpacing: "-0.035em",
        lineHeight: 1.05,
        color: P.ink,
        padding: vertical ? "0 80px" : "0 160px",
        boxSizing: "border-box",
        opacity: a,
        transform: `translateY(${(1 - a) * 16}px)`,
      }}
    >
      {parts[0]}
      {hot ? <span style={{ color: hotColour }}>{hot}</span> : null}
      {parts[1]}
    </div>
  );
};

export const Mono: React.FC<{ children: React.ReactNode; size?: number; colour?: string; style?: React.CSSProperties }> = ({ children, size = 26, colour = P.muted, style }) => (
  <div style={{ fontFamily: F.mono, fontSize: size, color: colour, letterSpacing: "0.01em", lineHeight: 1.35, ...style }}>{children}</div>
);

// The door number: the M² from m2de/brand, in ink with a green square, as it is on the post.
const runs = (kind: string) => {
  const out: string[] = [];
  MARK.forEach((row, y) => {
    let start = -1;
    for (let x = 0; x <= row.length; x++) {
      const on = x < row.length && row[x] === kind;
      if (on && start < 0) start = x;
      if (!on && start >= 0) {
        out.push(`M${start} ${y}h${x - start}v1h-${x - start}z`);
        start = -1;
      }
    }
  });
  return out.join("");
};

export const Door: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => {
  const { vertical, w } = useView();
  const height = vertical ? 40 : 32;
  return (
    <svg
      viewBox="0 0 14 7"
      shapeRendering="crispEdges"
      style={{ position: "absolute", top: vertical ? 110 : 64, left: w - (vertical ? 70 : 90) - height * 2, height, width: height * 2, opacity }}
    >
      <path fill={P.ink} d={runs("1")} />
      <path fill={P.pass} d={runs("2")} />
    </svg>
  );
};
