import React from "react";
import { Audio, continueRender, delayRender, Sequence, staticFile } from "remotion";

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
