// Editorial Lens: score color is the shared semantic layer—controlled, smooth, and readable.
type ColorStop = { score: number; color: string };

const scoreStops: ColorStop[] = [
  { score: 0, color: "#8B0000" },
  { score: 15, color: "#B91C1C" },
  { score: 25, color: "#EF4444" },
  { score: 39, color: "#F97316" },
  { score: 50, color: "#F59E0B" },
  { score: 59, color: "#EAB308" },
  { score: 65, color: "#D4D700" },
  { score: 70, color: "#A3C635" },
  { score: 74, color: "#84CC16" },
  { score: 80, color: "#4DAD35" },
  { score: 84, color: "#3FA34D" },
  { score: 85, color: "#22C55E" },
  { score: 90, color: "#16A34A" },
  { score: 95, color: "#15803D" },
  { score: 99, color: "#166534" },
  { score: 100, color: "#064E3B" },
];

const clamp = (value: number) => Math.max(0, Math.min(100, value));
const hexToRgb = (hex: string) => {
  const value = hex.replace("#", "");
  return { r: parseInt(value.slice(0, 2), 16), g: parseInt(value.slice(2, 4), 16), b: parseInt(value.slice(4, 6), 16) };
};
const rgbToHex = (r: number, g: number, b: number) => `#${[r, g, b].map((channel) => Math.round(channel).toString(16).padStart(2, "0")).join("")}`;

function interpolate(score: number, stops: ColorStop[]) {
  const normalized = clamp(score);
  if (normalized <= stops[0].score) return stops[0].color;
  if (normalized >= stops[stops.length - 1].score) return stops[stops.length - 1].color;
  const upperIndex = stops.findIndex((stop) => normalized <= stop.score);
  const lower = stops[upperIndex - 1];
  const upper = stops[upperIndex];
  const progress = (normalized - lower.score) / (upper.score - lower.score);
  const from = hexToRgb(lower.color);
  const to = hexToRgb(upper.color);
  return rgbToHex(from.r + (to.r - from.r) * progress, from.g + (to.g - from.g) * progress, from.b + (to.b - from.b) * progress);
}

/** Return the continuously interpolated quality color for a 0–100 percentage. */
export function getScoreColor(score: number) {
  return interpolate(score, scoreStops);
}

/** Return the semantic color for rejection risk, where lower is better. */
export function getRiskColor(score: number) {
  return getScoreColor(100 - clamp(score));
}

export function isPerfectScore(score: number) {
  return clamp(score) === 100;
}
