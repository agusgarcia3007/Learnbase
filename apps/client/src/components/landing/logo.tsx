import { cn } from "@/lib/utils";

type LearnPressLogoProps = {
  className?: string;
};

export function LearnPressLogo({ className }: LearnPressLogoProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-primary", className)}
    >
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <path
        d="M8 10h4v12H8V10zm6 0h4v12h-4V10zm6 0h4v12h-4V10z"
        fill="white"
        opacity="0.9"
      />
    </svg>
  );
}
