// Types for mark.js, copied as-is from m2de/brand (src/mark.js). Update both together.
export const MARK: string[];
export const INK: string;
export const CHALK: string;
export const PADDOCK: { red: string; yellow: string; green: string; gulf: string; violet: string };
export const LIGHT_ONLY_ON_DARK: string[];
export const COLS: number;
export const ROWS: number;
export function cells(kind?: "1" | "2"): { x: number; y: number; kind: string }[];
export function svg(opts?: { m?: string; square?: string; bg?: string | null; pad?: number; fit?: "square" | null; title?: string }): string;
export function squareBox(): { x: number; y: number; w: number; h: number };
