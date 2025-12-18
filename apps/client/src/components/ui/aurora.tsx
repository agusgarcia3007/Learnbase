import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface AuroraProps {
  className?: string;
  colors?: string[];
  speed?: number;
  blur?: number;
  opacity?: number;
}

export function Aurora({
  className = "",
  colors = ["#3b82f6", "#8b5cf6", "#06b6d4", "#6366f1"],
  speed = 1,
  blur = 100,
  opacity = 0.4,
}: AuroraProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion && containerRef.current) {
      containerRef.current.style.setProperty("--aurora-speed", "0");
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={
        {
          "--aurora-speed": `${20 / speed}s`,
          "--aurora-blur": `${blur}px`,
          "--aurora-opacity": opacity,
        } as React.CSSProperties
      }
    >
      <div className="absolute inset-0 bg-background" />
      {colors.map((color, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full mix-blend-screen dark:mix-blend-plus-lighter"
          style={{
            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
            width: "60%",
            height: "60%",
            filter: `blur(var(--aurora-blur))`,
            opacity: `var(--aurora-opacity)`,
          }}
          animate={{
            x: [
              `${10 + i * 20}%`,
              `${30 + i * 15}%`,
              `${-10 + i * 25}%`,
              `${10 + i * 20}%`,
            ],
            y: [
              `${-20 + i * 15}%`,
              `${10 + i * 10}%`,
              `${-10 + i * 20}%`,
              `${-20 + i * 15}%`,
            ],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{
            duration: 20 / speed,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 2,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
    </div>
  );
}
