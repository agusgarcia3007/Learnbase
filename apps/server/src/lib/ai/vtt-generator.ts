import type { SubtitleSegment } from "@/db/schema";

export function generateVTT(segments: SubtitleSegment[]): string {
  const lines = ["WEBVTT", ""];

  segments.forEach((segment, index) => {
    lines.push(`${index + 1}`);
    lines.push(`${formatVTTTime(segment.start)} --> ${formatVTTTime(segment.end)}`);
    lines.push(segment.text);
    lines.push("");
  });

  return lines.join("\n");
}

function formatVTTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(secs, 2)}.${pad(ms, 3)}`;
}

function pad(num: number, size: number): string {
  return num.toString().padStart(size, "0");
}
