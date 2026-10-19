import React from "react";
import { Composition } from "remotion";
import { FORMATS } from "./kit/layout";
import { DAY_ONE_FRAMES, DayOne } from "./stories/day-one/DayOne";
import { Faith, FAITH_FRAMES } from "./stories/spaghettification/Faith";
import { Nebula, NEBULA_FRAMES } from "./stories/spaghettification/Nebula";
import { Void, VOID_FRAMES } from "./stories/spaghettification/Void";
import { Horizon, HORIZON_FRAMES } from "./stories/spaghettification/Horizon";

// Spaghettification, one clip per black hole in the post.
const SPAGHETTI: [string, React.FC, number][] = [
  ["Faith", Faith, FAITH_FRAMES],
  ["Nebula", Nebula, NEBULA_FRAMES],
  ["Void", Void, VOID_FRAMES],
  ["Horizon", Horizon, HORIZON_FRAMES],
];

export const Root: React.FC = () => (
  <>
    {FORMATS.map((f) => (
      <Composition
        key={f.suffix}
        id={`DayOne-${f.suffix}`}
        component={DayOne}
        durationInFrames={DAY_ONE_FRAMES}
        fps={30}
        width={f.width}
        height={f.height}
      />
    ))}
    {SPAGHETTI.flatMap(([id, component, frames]) =>
      FORMATS.map((f) => (
        <Composition key={`${id}-${f.suffix}`} id={`${id}-${f.suffix}`} component={component} durationInFrames={frames} fps={30} width={f.width} height={f.height} />
      )),
    )}
  </>
);
