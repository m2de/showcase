import React from "react";
import { Composition } from "remotion";
import { DAY_ONE_FRAMES, DayOne } from "./stories/day-one/DayOne";

// Each story renders in two shapes: 9:16 for phones and 16:9 for the X timeline on desktop.
const FORMATS = [
  { suffix: "Vertical", width: 1080, height: 1920 },
  { suffix: "Landscape", width: 1920, height: 1080 },
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
  </>
);
