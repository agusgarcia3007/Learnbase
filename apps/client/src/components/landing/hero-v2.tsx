import { ClientOnly } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import SplitText from "@/components/SplitText";
import ShinyText from "@/components/ShinyText";
import { useTheme } from "@/components/ui/theme-provider";

const Beams = lazy(() => import("@/components/Beams"));

export function LandingHeroV2() {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <section className="relative min-h-screen overflow-hidden bg-background">
      <ClientOnly
        fallback={
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-100 via-background to-background" />
        }
      >
        <BeamsBackground theme={theme} />
      </ClientOnly>

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />

      <div className="relative z-10 flex min-h-screen items-center">
        <div className="mx-auto max-w-6xl px-6 py-32">
          <div className="mx-auto max-w-4xl text-center">
            <ShinyText
              text={t("landing.hero.badge")}
              className="mb-8 inline-flex items-center rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm font-medium backdrop-blur-sm"
              speed={3}
            />

            <div className="mb-6">
              <SplitText
                text={t("landing.hero.title")}
                className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
                delay={50}
                duration={0.8}
                ease="power3.out"
                splitType="words"
                tag="h1"
              />
            </div>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              {t("landing.hero.subtitle")}
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a href="#waitlist">
                <Button size="lg">
                  {t("landing.waitlist.cta")}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </a>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                {t("landing.hero.benefit1")}
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                {t("landing.hero.benefit2")}
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                {t("landing.hero.benefit3")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </section>
  );
}

function BeamsBackground({ theme }: { theme: string }) {
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  if (!isDark) {
    return (
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
    );
  }

  const primaryColor = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
  const hexColor = oklchToHex(primaryColor);

  return (
    <div className="absolute inset-0">
      <Suspense fallback={null}>
        <Beams
          beamWidth={3}
          beamHeight={20}
          beamNumber={8}
          lightColor={hexColor}
          speed={1.5}
          noiseIntensity={1.5}
          scale={0.2}
          rotation={-15}
        />
      </Suspense>
    </div>
  );
}

function oklchToHex(oklchStr: string): string {
  const match = oklchStr.match(/oklch\(([^)]+)\)/);
  if (!match) {
    const parts = oklchStr.split(/\s+/).filter(Boolean);
    if (parts.length >= 3) {
      return oklchValuesToHex(parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2]));
    }
    return "#8b5cf6";
  }
  const parts = match[1].split(/\s+/).filter(Boolean);
  if (parts.length < 3) return "#8b5cf6";
  return oklchValuesToHex(parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2]));
}

function oklchValuesToHex(l: number, c: number, h: number): string {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  let r = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  let g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  let bVal = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

  r = Math.max(0, Math.min(1, r));
  g = Math.max(0, Math.min(1, g));
  bVal = Math.max(0, Math.min(1, bVal));

  const toHex = (v: number) => {
    const srgb = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
    return Math.round(Math.max(0, Math.min(255, srgb * 255)))
      .toString(16)
      .padStart(2, "0");
  };

  return `#${toHex(r)}${toHex(g)}${toHex(bVal)}`;
}
