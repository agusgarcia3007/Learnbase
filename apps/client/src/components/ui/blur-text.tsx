import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface BlurTextProps {
  children: string;
  className?: string;
  delay?: number;
  duration?: number;
  once?: boolean;
}

export function BlurText({
  children,
  className = "",
  delay = 0,
  duration = 0.8,
  once = true,
}: BlurTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once, margin: "-100px" });

  return (
    <motion.span
      ref={ref}
      className={`inline-block ${className}`}
      initial={{
        opacity: 0,
        filter: "blur(20px)",
        y: 30,
      }}
      animate={
        isInView
          ? {
              opacity: 1,
              filter: "blur(0px)",
              y: 0,
            }
          : {}
      }
      transition={{
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {children}
    </motion.span>
  );
}
