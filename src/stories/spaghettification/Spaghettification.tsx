import React from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
import { BlackHole, HoleView } from "./BlackHole";
import { SERIES } from "./objects";
import { fadeIn, fadeOut, F, Label, P, Sfx, shadowPx, useStage, Vignette, Words } from "./space";

// A series of four short clips, one per black hole in Marco's post:
// marcomark.co.uk/blog/spaghettification.html (18 June 2026). Every line on screen is cut down from
// that post. Change the post first, then this.

export type Stage = ReturnType<typeof useStage>;

export type Timeline = {
  hook: [number, number];
  beats: [number, number][];
  horizon: [number, number];
  end: [number, number];
  total: number;
};

export type Script = {
  n: number;
  object: string;
  hook: string;
  beats: string[];
  horizonLabel: string;
  horizon: string;
  camera: { from: HoleView; to: HoleView };
  Visual: React.FC<{ t: Timeline; s: Stage; rIn: number }>;
  sounds?: (t: Timeline) => React.ReactNode;
};

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
const read = (s: string, min: number) => Math.max(min, Math.round(words(s) * 8.5 + 26));
const END = 96;

export const timeline = (sc: Script): Timeline => {
  let at = 0;
  const hookLen = read(sc.hook, 84);
  const hook: [number, number] = [0, hookLen];
  at = hookLen;
  const beats = sc.beats.map((b) => {
    const len = read(b, 60);
    const span: [number, number] = [at, at + len];
    at += len;
    return span;
  });
  const hLen = read(sc.horizon, 100) + 20;
  const horizon: [number, number] = [at, at + hLen];
  at += hLen;
  const end: [number, number] = [at, at + END];
  return { hook, beats, horizon, end, total: at + END };
};

const lerpView = (a: HoleView, b: HoleView, p: number): HoleView => {
  const m = (x: number | undefined, y: number | undefined, d: number) => (x ?? d) + ((y ?? d) - (x ?? d)) * p;
  return {
    dist: m(a.dist, b.dist, 26),
    tilt: m(a.tilt, b.tilt, 0.17),
    roll: m(a.roll, b.roll, 0),
    fov: m(a.fov, b.fov, 0.9),
    heat: m(a.heat, b.heat, 0.6),
    hueShift: m(a.hueShift, b.hueShift, 0),
  };
};

// Props must survive JSON, so a clip is picked by its place in the series.
export const Clip: React.FC<{ index: number }> = ({ index }) => {
  const sc = SERIES[index];
  const frame = useCurrentFrame();
  const s = useStage();
  const t = timeline(sc);
  const p = interpolate(frame, [0, t.end[0]], [0, 1], { extrapolateRight: "clamp" });
  const ease = 1 - Math.pow(1 - p, 2);
  const base = lerpView(sc.camera.from, sc.camera.to, ease);
  const flare = 0.9 * Math.exp(-frame / 10) + 0.5 * interpolate(frame, [t.horizon[0] - 4, t.horizon[0] + 6, t.horizon[1]], [0, 1, 0.4], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const view: HoleView = { ...base, heat: (base.heat ?? 0.6) + flare, centre: s.holeUv };
  const rIn = shadowPx(view.dist, view.fov ?? 0.9, s.min);
  // A little shove on the hook hit.
  const shake = Math.exp(-frame / 6) * 10;
  const endIn = fadeIn(frame, t.end[0], 18);
  const n = String(sc.n).padStart(2, "0");
  const W = s.words;

  return (
    <AbsoluteFill style={{ background: P.void, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${Math.sin(frame * 2.1) * shake}px, ${Math.cos(frame * 1.7) * shake}px) scale(${1.04 - p * 0.04})`, opacity: 1 - endIn * 0.7 }}>
        <BlackHole view={view} />
      </AbsoluteFill>
      <Vignette vertical={s.vertical} />
      <AbsoluteFill style={{ opacity: 1 - endIn }}>
        <sc.Visual t={t} s={s} rIn={rIn} />
      </AbsoluteFill>

      {/* Running header */}
      <div style={{ position: "absolute", left: s.vertical ? 80 : 110, top: s.vertical ? 110 : 80, opacity: 1 - endIn }}>
        <Label colour={P.amber} size={s.vertical ? 26 : 22}>
          Spaghettification · {n}/04
        </Label>
        <div style={{ fontFamily: F.sans, fontWeight: 500, fontSize: s.vertical ? 34 : 28, color: P.dust, marginTop: 10 }}>
          Object {n}: {sc.object}
        </div>
      </div>

      {/* The words */}
      <div style={{ position: "absolute", left: W.x, top: W.y, width: W.w, height: W.h, display: "flex", flexDirection: "column", justifyContent: s.vertical ? "flex-start" : "center" }}>
        <div style={{ position: "relative" }}>
          <Words text={sc.hook} at={0} until={t.hook[1]} size={s.hookSize} instant pull={{ x: s.hole.x - W.x - W.w / 2, y: s.hole.y - W.y }} />
        </div>
      </div>
      {sc.beats.map((b, i) => (
        <div key={i} style={{ position: "absolute", left: W.x, top: W.y, width: W.w, height: W.h, display: "flex", flexDirection: "column", justifyContent: s.vertical ? "flex-start" : "center" }}>
          <Words text={b} at={t.beats[i][0]} until={t.beats[i][1]} size={s.lineSize} pull={{ x: s.hole.x - W.x - W.w / 2, y: s.hole.y - W.y }} />
        </div>
      ))}
      <div style={{ position: "absolute", left: W.x, top: W.y, width: W.w, height: W.h, display: "flex", flexDirection: "column", justifyContent: s.vertical ? "flex-start" : "center", opacity: frame >= t.horizon[0] && frame <= t.horizon[1] ? 1 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 26, opacity: fadeIn(frame, t.horizon[0]) * fadeOut(frame, t.horizon[1] - 12) }}>
          <div style={{ width: interpolate(frame, [t.horizon[0], t.horizon[0] + 20], [0, 70], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), height: 3, background: P.ember, boxShadow: `0 0 14px ${P.ember}` }} />
          <Label colour={P.ember} size={s.vertical ? 30 : 26}>
            {sc.horizonLabel}
          </Label>
        </div>
        <Words text={sc.horizon} at={t.horizon[0] + 8} until={t.horizon[1]} size={s.hookSize * 0.92} pull={{ x: s.hole.x - W.x - W.w / 2, y: s.hole.y - W.y }} />
      </div>

      <EndCard sc={sc} at={t.end[0]} />

      <Audio src={staticFile("sfx/space/drone.wav")} loop volume={(f) => 0.55 * fadeIn(f, 0, 6) * fadeOut(f, t.total - 30, 30)} />
      <Sfx at={0} name="boom" volume={0.9} />
      {t.beats.map(([at], i) => (
        <Sfx key={i} at={at} name="ping" volume={0.22} />
      ))}
      <Sfx at={t.horizon[0] - 44} name="whoosh" volume={0.7} />
      <Sfx at={t.horizon[0]} name="boom" volume={0.55} />
      {sc.sounds?.(t)}
    </AbsoluteFill>
  );
};

const EndCard: React.FC<{ sc: Script; at: number }> = ({ sc, at }) => {
  const frame = useCurrentFrame();
  const s = useStage();
  if (frame < at) return null;
  const a = fadeIn(frame, at, 16);
  const b = fadeIn(frame, at + 10, 16);
  const c = fadeIn(frame, at + 20, 16);
  const size = s.vertical ? 92 : 104;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center", padding: 80 }}>
      <Label colour={P.amber} size={s.vertical ? 28 : 26} style={{ opacity: a }}>
        Object {String(sc.n).padStart(2, "0")} of 04
      </Label>
      <div
        style={{
          fontFamily: F.sans,
          fontWeight: 700,
          fontSize: size,
          letterSpacing: "-0.03em",
          color: P.starlight,
          marginTop: 24,
          opacity: a,
          // The title itself gets spaghettified into place.
          transform: `scale(${1 + (1 - a) * 0.6}, ${1 - (1 - a) * 0.5})`,
          filter: `blur(${(1 - a) * 12}px)`,
          textShadow: `0 0 40px rgba(169,107,255,0.6)`,
        }}
      >
        Spaghettification
      </div>
      <div style={{ fontFamily: F.sans, fontWeight: 500, fontSize: s.vertical ? 44 : 40, color: P.dust, marginTop: 28, maxWidth: s.vertical ? 860 : 1200, opacity: b, lineHeight: 1.25 }}>
        A black hole is any gap in what your agent can see.
      </div>
      <div style={{ fontFamily: F.mono, fontSize: s.vertical ? 32 : 30, color: P.gold, marginTop: 50, opacity: c }}>marcomark.co.uk/blog/spaghettification</div>
    </AbsoluteFill>
  );
};
