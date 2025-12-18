import type { ReactNode } from "react";

interface ShimmerBorderProps {
  children: ReactNode;
  className?: string;
  borderRadius?: string;
  borderWidth?: number;
  shimmerColor?: string;
  backgroundColor?: string;
}

export function ShimmerBorder({
  children,
  className = "",
  borderRadius = "0.75rem",
  borderWidth = 1,
  shimmerColor = "hsl(var(--primary))",
  backgroundColor = "hsl(var(--card))",
}: ShimmerBorderProps) {
  return (
    <div
      className={`relative ${className}`}
      style={
        {
          "--shimmer-color": shimmerColor,
          "--bg-color": backgroundColor,
          "--border-radius": borderRadius,
          "--border-width": `${borderWidth}px`,
        } as React.CSSProperties
      }
    >
      <div
        className="absolute -inset-px overflow-hidden"
        style={{ borderRadius: `calc(var(--border-radius) + 1px)` }}
      >
        <div
          className="absolute inset-0 animate-shimmer"
          style={{
            background: `conic-gradient(from 0deg, transparent 0deg, var(--shimmer-color) 60deg, transparent 120deg)`,
            animation: "shimmer 3s linear infinite",
          }}
        />
      </div>
      <div
        className="relative"
        style={{
          borderRadius: "var(--border-radius)",
          backgroundColor: "var(--bg-color)",
        }}
      >
        {children}
      </div>
      <style>{`
        @keyframes shimmer {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
