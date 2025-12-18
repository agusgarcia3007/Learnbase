import { motion, type Variants } from "framer-motion";

interface SplitTextProps {
  children: string;
  className?: string;
  delay?: number;
  staggerDelay?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

const containerVariants: Variants = {
  hidden: {},
  visible: (staggerDelay: number) => ({
    transition: {
      staggerChildren: staggerDelay,
    },
  }),
};

const charVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    filter: "blur(10px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

export function SplitText({
  children,
  className = "",
  delay = 0,
  staggerDelay = 0.03,
  as: Component = "span",
}: SplitTextProps) {
  const words = children.split(" ");

  return (
    <Component className={className}>
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-block whitespace-nowrap">
          <motion.span
            className="inline-block"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            custom={staggerDelay}
            transition={{ delayChildren: delay + wordIndex * 0.1 }}
          >
            {word.split("").map((char, charIndex) => (
              <motion.span
                key={charIndex}
                className="inline-block"
                variants={charVariants}
              >
                {char}
              </motion.span>
            ))}
          </motion.span>
          {wordIndex < words.length - 1 && (
            <span className="inline-block">&nbsp;</span>
          )}
        </span>
      ))}
    </Component>
  );
}
