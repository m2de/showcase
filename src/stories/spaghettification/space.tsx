import React from "react";
import {
  Audio,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  random,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useIsVertical } from "../../kit/layout";

// The look of the Spaghettification post (marcomark.co.uk/blog/spaghettification.html):
// void black, ember and gold heat, violet dust, Space Grotesk over Spline Sans Mono labels.

export const P = {
  void: "#05030a",
  deep: "#0c0820",
  violet: "#a96bff",
  indigo: "#6b4fd6",
  starlight: "#ece6ff",
  dust: "#9488b8",
  ember: "#ff6b1a",
  amber: "#ff9d4d",
  gold: "#ffc15e",
};

export const F = {
  sans: "Space Grotesk",
  mono: "Spline Sans Mono",
};

const FONTS: [string, string, string][] = [
  [F.sans, "space-grotesk/space-grotesk-latin-400-normal.woff2", "400"],
  [F.sans, "space-grotesk/space-grotesk-latin-500-normal.woff2", "500"],
  [F.sans, "space-grotesk/space-grotesk-latin-700-normal.woff2", "700"],
  [F.mono, "spline-sans-mono/spline-sans-mono-latin-400-normal.woff2", "400"],
  [F.mono, "spline-sans-mono/spline-sans-mono-latin-600-normal.woff2", "600"],
];

const fontHandle = delayRender("Loading space fonts");
Promise.all(
  FONTS.map(([family, file, weight]) =>
    new FontFace(family, `url(${staticFile(`fonts/${file}`)})`, { weight })
      .load()
      .then((f) => document.fonts.add(f)),
  ),
).then(() => continueRender(fontHandle));

export const Sfx: React.FC<{ at: number; name: string; volume?: number; dur?: number }> = ({ at, name, volume = 1, dur }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={dur ?? 100} layout="none">
    <Audio src={staticFile(`sfx/space/${name}.wav`)} volume={volume} />
  </Sequence>
);

// ---------------------------------------------------------------- layout

export type Box = { x: number; y: number; w: number; h: number };

// Where things sit in each shape. Vertical: hole in the upper middle, words underneath, a slot
// above for the clip's own diagram. Landscape: hole on the right, words on the left.
export const useStage = () => {
  const vertical = useIsVertical();
  const { width, height } = useVideoConfig();
  const hole = vertical ? { x: 540, y: 800 } : { x: 1340, y: 520 };
  const min = Math.min(width, height);
  return {
    vertical,
    hole,
    holeUv: [(hole.x - width / 2) / min, (height / 2 - hole.y) / min] as [number, number],
    words: (vertical ? { x: 80, y: 1230, w: 920, h: 560 } : { x: 110, y: 250, w: 820, h: 620 }) as Box,
    slot: (vertical ? { x: 90, y: 250, w: 900, h: 330 } : { x: 1000, y: 820, w: 820, h: 210 }) as Box,
    hookSize: vertical ? 108 : 92,
    lineSize: vertical ? 82 : 66,
    min,
  };
};

// Apparent radius of the shadow on screen, for things that need to fall into it.
export const shadowPx = (dist: number, fov: number, min: number) => ((2.6 / dist) / fov) * min;

// ---------------------------------------------------------------- words

// *stars* mark the words that run hot.
const parse = (text: string) => {
  const out: { w: string; hot: boolean }[] = [];
  text.split("*").forEach((seg, i) =>
    seg.split(/\s+/).filter(Boolean).forEach((w) => {
      // Lone punctuation sticks to the word before it, so a full stop never wraps on its own.
      if (/^[.,!?;:]+$/.test(w) && out.length) out[out.length - 1].w += w;
      else out.push({ w, hot: i % 2 === 1 });
    }),
  );
  return out;
};

export const Words: React.FC<{
  text: string;
  at: number;
  until: number;
  size: number;
  pull?: { x: number; y: number };
  instant?: boolean;
  colour?: string;
  mono?: boolean;
}> = ({ text, at, until, size, pull, instant, colour = P.starlight, mono }) => {
  const frame = useCurrentFrame();
  if (frame < at - 1 || frame > until + 1) return null;
  const words = parse(text);
  // On the way out each line gets dragged a little toward the hole and stretched, like everything else.
  const out = interpolate(frame, [until - 12, until], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  return (
    <div
      style={{
        fontFamily: mono ? F.mono : F.sans,
        fontWeight: mono ? 400 : 700,
        fontSize: size,
        lineHeight: 1.12,
        letterSpacing: mono ? 0 : "-0.02em",
        color: colour,
        opacity: 1 - out,
        filter: `blur(${out * 14}px)`,
        transform: `${pull ? `translate(${pull.x * out * 0.25}px, ${pull.y * out * 0.25}px) scale(${1 - out * 0.15}, ${1 + out * 0.4})` : ""} ${
          instant ? `scale(${1 + 0.08 * Math.exp(-(frame - at) / 4)})` : ""
        }`,
        transformOrigin: "0% 50%",
        textShadow: `0 0 ${size * 0.5}px rgba(5,3,10,0.95), 0 0 ${size * 0.15}px rgba(5,3,10,0.9)`,
      }}
    >
      {words.map(({ w, hot }, i) => {
        const start = at + (instant ? 0 : i * 2.2);
        const p = instant ? 1 : interpolate(frame, [start, start + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              marginRight: "0.26em",
              opacity: p,
              filter: `blur(${(1 - p) * 10}px)`,
              transform: `translateY(${(1 - p) * size * 0.35}px)`,
              color: hot ? P.amber : undefined,
              textShadow: hot ? `0 0 ${size * 0.4}px rgba(255,107,26,0.55), 0 0 ${size * 0.5}px rgba(5,3,10,0.95)` : undefined,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

export const Label: React.FC<{ children: React.ReactNode; colour?: string; size?: number; style?: React.CSSProperties }> = ({
  children,
  colour = P.dust,
  size = 26,
  style,
}) => (
  <div style={{ fontFamily: F.mono, fontWeight: 600, fontSize: size, letterSpacing: "0.18em", textTransform: "uppercase", color: colour, ...style }}>
    {children}
  </div>
);

// ---------------------------------------------------------------- the stretch

// Tokens spiralling into the hole, stretched along the radius as they go. Spaghettification.
export const Infall: React.FC<{
  tokens: string[];
  from: number;
  to: number;
  every?: number;
  life?: number;
  hole: { x: number; y: number };
  rIn: number;
  rOut: number;
  size?: number;
  seed?: string;
  squash?: number;
  colour?: string;
}> = ({ tokens, from, to, every = 9, life = 80, hole, rIn, rOut, size = 30, seed = "s", squash = 0.42, colour = P.starlight }) => {
  const frame = useCurrentFrame();
  const items: React.ReactNode[] = [];
  for (let s = from, i = 0; s <= to; s += every, i++) {
    const p = (frame - s) / life;
    if (p < 0 || p >= 1) continue;
    const a0 = random(`${seed}-a-${i}`) * Math.PI * 2;
    const r0 = rOut * (0.85 + random(`${seed}-r-${i}`) * 0.35);
    const ease = Math.pow(p, 1.7);
    const r = rIn + (r0 - rIn) * (1 - ease);
    const a = a0 + 2.6 * ease + 0.6 * p;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r * squash;
    const radial = Math.atan2(y, x);
    const stretch = 1 + 7 * Math.pow(p, 3);
    const fadeIn = Math.min(1, p / 0.12);
    const fadeOut = Math.min(1, (1 - p) / 0.15);
    const hot = Math.pow(p, 1.5);
    const col = hot > 0.5 ? P.amber : colour;
    items.push(
      <div
        key={i}
        style={{
          position: "absolute",
          left: hole.x + x,
          top: hole.y + y,
          fontFamily: F.mono,
          fontSize: size,
          whiteSpace: "nowrap",
          color: col,
          opacity: fadeIn * fadeOut * 0.95,
          transform: `translate(-50%, -50%) rotate(${radial}rad) scale(${stretch}, ${1 / Math.sqrt(stretch)}) rotate(${radial > Math.PI / 2 || radial < -Math.PI / 2 ? Math.PI : 0}rad)`,
          filter: `blur(${hot * 2.5}px)`,
          textShadow: `0 0 ${8 + hot * 20}px ${hot > 0.3 ? "rgba(255,107,26,0.8)" : "rgba(169,107,255,0.6)"}`,
        }}
      >
        {tokens[i % tokens.length]}
      </div>,
    );
  }
  return <>{items}</>;
};

// ---------------------------------------------------------------- frame furniture

export const Vignette: React.FC<{ vertical: boolean }> = ({ vertical }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: vertical
        ? "linear-gradient(180deg, rgba(5,3,10,0.55) 0%, rgba(5,3,10,0) 18%, rgba(5,3,10,0) 52%, rgba(5,3,10,0.75) 66%, rgba(5,3,10,0.92) 100%)"
        : "linear-gradient(90deg, rgba(5,3,10,0.92) 0%, rgba(5,3,10,0.75) 38%, rgba(5,3,10,0) 58%), linear-gradient(180deg, rgba(5,3,10,0.5) 0%, rgba(5,3,10,0) 20%, rgba(5,3,10,0) 75%, rgba(5,3,10,0.6) 100%)",
    }}
  />
);

export const fadeIn = (frame: number, at: number, len = 12) =>
  interpolate(frame, [at, at + len], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

export const fadeOut = (frame: number, at: number, len = 12) =>
  interpolate(frame, [at, at + len], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
