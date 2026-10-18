import React from "react";
import { Composition } from "remotion";
import { FORMATS } from "./kit/layout";
import { DAY_ONE_FRAMES, DayOne } from "./stories/day-one/DayOne";
import { SERIES } from "./stories/spaghettification/objects";
import { Clip, timeline } from "./stories/spaghettification/Spaghettification";

const SLUGS = ["Dependency", "Memory", "Data", "FalseHorizon"];

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
    {SERIES.flatMap((sc, i) =>
      FORMATS.map((f) => (
        <Composition
          key={`${i}-${f.suffix}`}
          id={`Spaghetti${String(sc.n).padStart(2, "0")}${SLUGS[i]}-${f.suffix}`}
          component={Clip}
          defaultProps={{ index: i }}
          durationInFrames={timeline(sc).total}
          fps={30}
          width={f.width}
          height={f.height}
        />
      )),
    )}
  </>
);
