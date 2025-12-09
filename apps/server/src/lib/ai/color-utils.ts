import Color from "color";

export function hexToOklch(hex: string): string {
  const color = Color(hex);
  const [l, c, h] = color.oklch().array();
  const lightness = (l / 100).toFixed(2);
  const chroma = (c / 100).toFixed(3);
  const hue = Number.isNaN(h) ? 0 : Math.round(h);
  return `oklch(${lightness} ${chroma} ${hue})`;
}
