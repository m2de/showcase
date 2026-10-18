import { useVideoConfig } from "remotion";

// Style-free helpers only. Looks (colours, fonts, effects) live with the story that uses them.

// A "unit" scales with the shorter side so the same scene works in 9:16 and 16:9.
export const useUnit = () => {
  const { width, height } = useVideoConfig();
  // Phones have height to spare, so vertical text runs a little larger.
  return (Math.min(width, height) / 100) * (height > width ? 1.2 : 1);
};

export const useIsVertical = () => {
  const { width, height } = useVideoConfig();
  return height > width;
};

// Each story renders in two shapes: 9:16 for phones and 16:9 for the X timeline on desktop.
export const FORMATS = [
  { suffix: "Vertical", width: 1080, height: 1920 },
  { suffix: "Landscape", width: 1920, height: 1080 },
] as const;
