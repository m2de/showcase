import React from "react";
import { AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Band, C, FONT, PopIn, Screen, Typed, useIsVertical, useUnit } from "../../kit/teletext";

// Words are Marco's, from draft 2 in social/x-playbook.md and the post at
// marcomark.co.uk/blog/every-session-is-day-one.html. Change them there first.

export const DAY_ONE_FRAMES = 720;

const Body: React.FC<{ children: React.ReactNode; justify?: React.CSSProperties["justifyContent"] }> = ({
  children,
  justify = "center",
}) => {
  const u = useUnit();
  return (
    <AbsoluteFill
      style={{
        padding: `${4 * u}px ${6 * u}px ${10 * u}px`,
        display: "flex",
        flexDirection: "column",
        justifyContent: justify,
        gap: 4 * u,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const Title: React.FC = () => {
  const u = useUnit();
  const vertical = useIsVertical();
  const frame = useCurrentFrame();
  const words = ["EVERY", "SESSION", "IS", "DAY", "ONE"];
  return (
    <Body>
      <Band bg={C.blue} fg={C.yellow}>
        NOTES ON AGENTS
      </Band>
      <div style={{ display: "flex", flexWrap: "wrap", gap: `${1 * u}px ${3 * u}px` }}>
        {words.map((w, i) => (
          <span
            key={w}
            style={{
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: (vertical ? 13 : 12) * u,
              lineHeight: 1,
              color: i >= 3 ? C.yellow : C.white,
              // Double-height teletext text is tall and narrow.
              transform: "scaleY(1.35)",
              transformOrigin: "bottom",
              visibility: frame >= 6 + i * 7 ? "visible" : "hidden",
              paddingTop: 3 * u,
            }}
          >
            {w}
          </span>
        ))}
      </div>
      <Typed text="It's an onboarding problem." start={45} style={{ color: C.cyan, fontSize: 4.6 * u }} />
    </Body>
  );
};

const Badge: React.FC<{ scale?: number }> = ({ scale = 1 }) => {
  const u = useUnit() * scale;
  return (
    <div
      style={{
        width: 30 * u,
        border: `${0.8 * u}px solid ${C.white}`,
        fontFamily: FONT,
        fontWeight: 700,
        textAlign: "center",
        background: C.black,
      }}
    >
      <div style={{ background: C.red, color: C.white, fontSize: 4 * u, padding: `${1 * u}px 0` }}>VISITOR</div>
      <div style={{ color: C.white, fontSize: 3 * u, paddingTop: 2 * u }}>NEW STARTER</div>
      <div style={{ color: C.yellow, fontSize: 9 * u, padding: `${1 * u}px 0 ${2 * u}px` }}>DAY 1</div>
    </div>
  );
};

const NewStarter: React.FC = () => {
  const u = useUnit();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - 70, fps, config: { damping: 12, mass: 0.6 } });
  return (
    <Body>
      <div style={{ color: C.white, fontSize: 6.4 * u, fontWeight: 700, lineHeight: 1.25 }}>
        <Typed text="Every agent session is a new starter on their first day." cps={30} />
      </div>
      <div style={{ display: "flex", justifyContent: "center", transform: `scale(${pop}) rotate(${(1 - pop) * -8}deg)` }}>
        {frame >= 70 ? <Badge scale={1.3} /> : null}
      </div>
    </Body>
  );
};

const Countdown: React.FC = () => {
  const u = useUnit();
  const frame = useCurrentFrame();
  const left = Math.round(interpolate(frame, [30, 95], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const blocks = 15;
  const filled = Math.ceil((left / 30) * blocks);
  return (
    <Body>
      <div style={{ color: C.white, fontSize: 6.4 * u, fontWeight: 700, lineHeight: 1.25 }}>
        <Typed text="Except the induction gets about thirty seconds" cps={34} />
      </div>
      <PopIn at={24} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 * u }}>
        <Band bg={C.cyan} fg={C.black} size={3.6}>
          INDUCTION
        </Band>
        <div
          style={{
            fontSize: 26 * u,
            fontWeight: 700,
            lineHeight: 1,
            color: left <= 5 ? C.red : C.yellow,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          00:{String(left).padStart(2, "0")}
        </div>
        <div style={{ display: "flex", gap: 1 * u }}>
          {Array.from({ length: blocks }).map((_, i) => (
            <div key={i} style={{ width: 4 * u, height: 4 * u, background: i < filled ? C.green : "#222" }} />
          ))}
        </div>
      </PopIn>
    </Body>
  );
};

const FiftyTimes: React.FC = () => {
  const u = useUnit();
  const vertical = useIsVertical();
  const frame = useCurrentFrame();
  const shown = Math.min(50, Math.max(0, Math.floor(interpolate(frame, [28, 88], [1, 50]))));
  const cols = vertical ? 5 : 10;
  return (
    <Body>
      <div style={{ color: C.white, fontSize: 6.4 * u, fontWeight: 700, lineHeight: 1.25 }}>
        <Typed text="and it happens fifty times before lunch." cps={34} />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 1.4 * u,
          alignSelf: "center",
        }}
      >
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} style={{ visibility: i < shown ? "visible" : "hidden" }}>
            <Badge scale={vertical ? 0.29 : 0.24} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 5 * u, fontWeight: 700 }}>
        <span style={{ color: C.yellow }}>SESSIONS {String(shown).padStart(2, "0")}</span>
        <span style={{ color: C.cyan }}>{shown >= 50 ? "11:59" : "09:00"}</span>
      </div>
    </Body>
  );
};

const Reframe: React.FC = () => {
  const u = useUnit();
  const frame = useCurrentFrame();
  const line: React.CSSProperties = { fontSize: 6 * u, fontWeight: 700, lineHeight: 1.25 };
  return (
    <Body>
      <div style={{ ...line, color: C.white }}>Most</div>
      <div style={{ ...line }}>
        <span
          style={{
            color: frame >= 46 ? C.dim : C.white,
            textDecorationLine: frame >= 40 ? "line-through" : "none",
            textDecorationColor: C.red,
            textDecorationThickness: 1.2 * u,
          }}
        >
          &ldquo;the model isn&rsquo;t good enough&rdquo;
        </span>
      </div>
      <PopIn at={62} style={{ ...line, color: C.white }}>
        problems are really
      </PopIn>
      <div style={{ ...line, color: C.green }}>
        <Typed
          text="“this repo couldn’t onboard anyone in thirty seconds”"
          start={80}
          cps={30}
          cursor={false}
        />
      </div>
      <PopIn at={140} style={{ ...line, color: C.white }}>
        problems.
      </PopIn>
    </Body>
  );
};

const Fastext: React.FC = () => {
  const u = useUnit();
  const items: [string, string][] = [
    ["#ff4040", "Blog"],
    [C.green, "Claude Code"],
    [C.yellow, "Projects"],
    [C.cyan, "About"],
  ];
  return (
    <div
      style={{
        position: "absolute",
        bottom: 4 * u,
        left: 6 * u,
        right: 6 * u,
        display: "flex",
        justifyContent: "space-between",
        fontSize: 3.6 * u,
        fontWeight: 700,
      }}
    >
      {items.map(([c, label]) => (
        <span key={label} style={{ color: c }}>
          {label}
        </span>
      ))}
    </div>
  );
};

const Outro: React.FC = () => {
  const u = useUnit();
  return (
    <Body>
      <Band bg={C.yellow} fg={C.black}>
        THE FULL STORY
      </Band>
      <div style={{ color: C.white, fontSize: 7 * u, fontWeight: 700, lineHeight: 1.2 }}>Every Session Is Day One</div>
      <div style={{ color: C.cyan, fontSize: 4.4 * u }}>
        <Typed text="marcomark.co.uk/blog" start={10} cps={24} />
      </div>
      <Fastext />
    </Body>
  );
};

export const DayOne: React.FC = () => (
  <Screen page="P101">
    <Sequence durationInFrames={90}>
      <Title />
    </Sequence>
    <Sequence from={90} durationInFrames={150}>
      <NewStarter />
    </Sequence>
    <Sequence from={240} durationInFrames={120}>
      <Countdown />
    </Sequence>
    <Sequence from={360} durationInFrames={120}>
      <FiftyTimes />
    </Sequence>
    <Sequence from={480} durationInFrames={150}>
      <Reframe />
    </Sequence>
    <Sequence from={630} durationInFrames={90}>
      <Outro />
    </Sequence>
  </Screen>
);
