import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronRight, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { TextEffect } from "@/components/ui/text-effect";
import { AnimatedGroup } from "@/components/ui/animated-group";

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(12px)",
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring" as const,
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
};

export function LandingHero() {
  const { t, i18n } = useTranslation();

  return (
    <section className="relative isolate overflow-hidden bg-background">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.3 }}
        className="pointer-events-none absolute inset-x-0 top-0 h-[800px] lg:h-[900px]"
      >
        <img
          src="/images/night-landscape.webp"
          alt=""
          className="hidden h-full w-full object-cover object-top opacity-50 dark:block"
        />
        <img
          src="/images/day-landscape.webp"
          alt=""
          className="h-full w-full object-cover object-top opacity-60 dark:hidden"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
      </motion.div>

      <div className="relative z-10 pt-20 md:pt-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
            <AnimatedGroup variants={transitionVariants}>
              <Link
                to="/signup"
                className="hover:bg-background/80 dark:hover:border-t-border bg-background/50 backdrop-blur-sm group mx-auto flex w-fit items-center gap-4 rounded-full border border-border/50 p-1 pl-4 shadow-md shadow-zinc-950/5 transition-colors duration-300 dark:border-t-white/5 dark:shadow-zinc-950"
              >
                <span className="text-foreground flex items-center gap-2 text-sm">
                  <Sparkles className="size-4 text-primary" />
                  {t("landing.hero.badge")}
                </span>
                <span className="dark:border-background block h-4 w-0.5 border-l bg-white dark:bg-zinc-700"></span>

                <div className="bg-background group-hover:bg-muted size-6 overflow-hidden rounded-full duration-500">
                  <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                    <span className="flex size-6">
                      <ArrowRight className="m-auto size-3" />
                    </span>
                    <span className="flex size-6">
                      <ArrowRight className="m-auto size-3" />
                    </span>
                  </div>
                </div>
              </Link>
            </AnimatedGroup>

            <h1 className="mx-auto mt-8 max-w-4xl text-balance text-5xl font-bold max-md:font-semibold md:text-7xl lg:mt-16 xl:text-[5.25rem]">
              <TextEffect key={`title-${i18n.language}`} preset="fade-in-blur" speedSegment={0.3} as="span">
                {t("landing.hero.title")}
              </TextEffect>{" "}
              <TextEffect
                key={`titleHighlight-${i18n.language}`}
                preset="fade-in-blur"
                speedSegment={0.3}
                delay={0.4}
                as="span"
                className="text-primary"
              >
                {t("landing.hero.titleHighlight")}
              </TextEffect>
            </h1>
            <p className="text-muted-foreground mx-auto mt-8 max-w-2xl text-balance text-lg">
              <TextEffect
                key={`subtitle-${i18n.language}`}
                per="line"
                preset="fade-in-blur"
                speedSegment={0.3}
                delay={0.5}
                as="span"
              >
                {t("landing.hero.subtitle")}
              </TextEffect>{" "}
              <TextEffect
                key={`subtitleHighlight-${i18n.language}`}
                per="line"
                preset="fade-in-blur"
                speedSegment={0.3}
                delay={0.7}
                as="span"
                className="text-foreground font-medium"
              >
                {t("landing.hero.subtitleHighlight")}
              </TextEffect>
            </p>

            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.75,
                    },
                  },
                },
                ...transitionVariants,
              }}
              className="mt-12 flex flex-col items-center justify-center gap-2 md:flex-row"
            >
              <div
                key={1}
                className="bg-foreground/10 rounded-[calc(var(--radius-xl)+0.125rem)] border p-0.5"
              >
                <Button asChild size="lg" className="rounded-xl px-5 text-base">
                  <Link to="/signup">
                    <span className="text-nowrap">{t("landing.hero.cta")}</span>
                  </Link>
                </Button>
              </div>
              <Button
                key={2}
                asChild
                size="lg"
                variant="ghost"
                className="h-10.5 rounded-xl px-5"
              >
                <a href="#pricing">
                  <span className="text-nowrap">
                    {t("landing.hero.ctaSecondary")}
                  </span>
                </a>
              </Button>
            </AnimatedGroup>
          </div>
        </div>

        <AnimatedGroup
          variants={{
            container: {
              visible: {
                transition: {
                  staggerChildren: 0.05,
                  delayChildren: 0.75,
                },
              },
            },
            ...transitionVariants,
          }}
        >
          <div className="mask-b-from-55% relative -mr-56 mt-8 overflow-hidden px-2 sm:mr-0 sm:mt-12 md:mt-20">
            <div className="inset-shadow-2xs ring-background dark:inset-shadow-white/20 bg-background relative mx-auto max-w-6xl overflow-hidden rounded-2xl border p-4 shadow-lg shadow-zinc-950/15 ring-1">
              <img
                className="bg-background aspect-[15/8] relative rounded-2xl object-cover"
                src="/images/hero-screenshot.png"
                alt="LearnBase Dashboard"
              />
            </div>
          </div>
        </AnimatedGroup>
      </div>
      <section className="bg-background pb-16 pt-16 md:pb-32">
        <div className="group relative m-auto max-w-5xl px-6">
          <div className="absolute inset-0 z-10 flex scale-95 items-center justify-center opacity-0 duration-500 group-hover:scale-100 group-hover:opacity-100">
            <Link
              to="/features"
              className="block text-sm duration-150 hover:opacity-75"
            >
              <span>{t("landing.hero.meetCustomers")}</span>
              <ChevronRight className="ml-1 inline-block size-3" />
            </Link>
          </div>
          <div className="group-hover:blur-xs mx-auto mt-12 grid max-w-2xl grid-cols-4 gap-x-12 gap-y-8 transition-all duration-500 group-hover:opacity-50 sm:gap-x-16 sm:gap-y-14">
            <div className="flex">
              <img
                className="mx-auto h-5 w-fit dark:invert"
                src="https://html.tailus.io/blocks/customers/nvidia.svg"
                alt="Nvidia Logo"
                height="20"
                width="auto"
              />
            </div>

            <div className="flex">
              <img
                className="mx-auto h-4 w-fit dark:invert"
                src="https://html.tailus.io/blocks/customers/column.svg"
                alt="Column Logo"
                height="16"
                width="auto"
              />
            </div>
            <div className="flex">
              <img
                className="mx-auto h-4 w-fit dark:invert"
                src="https://html.tailus.io/blocks/customers/github.svg"
                alt="GitHub Logo"
                height="16"
                width="auto"
              />
            </div>
            <div className="flex">
              <img
                className="mx-auto h-5 w-fit dark:invert"
                src="https://html.tailus.io/blocks/customers/nike.svg"
                alt="Nike Logo"
                height="20"
                width="auto"
              />
            </div>
            <div className="flex">
              <img
                className="mx-auto h-5 w-fit dark:invert"
                src="https://html.tailus.io/blocks/customers/lemonsqueezy.svg"
                alt="Lemon Squeezy Logo"
                height="20"
                width="auto"
              />
            </div>
            <div className="flex">
              <img
                className="mx-auto h-4 w-fit dark:invert"
                src="https://html.tailus.io/blocks/customers/laravel.svg"
                alt="Laravel Logo"
                height="16"
                width="auto"
              />
            </div>
            <div className="flex">
              <img
                className="mx-auto h-7 w-fit dark:invert"
                src="https://html.tailus.io/blocks/customers/lilly.svg"
                alt="Lilly Logo"
                height="28"
                width="auto"
              />
            </div>

            <div className="flex">
              <img
                className="mx-auto h-6 w-fit dark:invert"
                src="https://html.tailus.io/blocks/customers/openai.svg"
                alt="OpenAI Logo"
                height="24"
                width="auto"
              />
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
