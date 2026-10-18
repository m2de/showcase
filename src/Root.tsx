import React from "react";
import { Composition } from "remotion";
import { FORMATS } from "./kit/layout";
import { DAY_ONE_FRAMES, DayOne } from "./stories/day-one/DayOne";


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
  </>
);
