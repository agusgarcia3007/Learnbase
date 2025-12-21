import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Video, Bot, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  {
    id: "courses",
    icon: Video,
    image: "/images/demo-courses.png",
  },
  {
    id: "ai",
    icon: Bot,
    image: "/images/demo-ai.png",
  },
  {
    id: "students",
    icon: GraduationCap,
    image: "/images/demo-students.png",
  },
] as const;

export function ProductDemo() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("courses");

  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  return (
    <section className="relative overflow-hidden bg-muted/30 py-24 md:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary">
            {t("landing.productDemo.eyebrow", { defaultValue: "Platform" })}
          </p>
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {t("landing.productDemo.title", { defaultValue: "See it in action" })}
          </h2>
          <p className="mx-auto max-w-2xl text-balance text-lg text-muted-foreground">
            {t("landing.productDemo.subtitle", { defaultValue: "Everything you need to create and sell courses online" })}
          </p>
        </motion.div>

        <motion.div
          className="mb-10 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="inline-flex gap-1 rounded-full border border-border/50 bg-background/80 p-1 backdrop-blur-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all",
                  activeTab === tab.id
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-full bg-primary"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <tab.icon className="size-4" />
                  <span className="hidden sm:inline">
                    {t(`landing.productDemo.tabs.${tab.id}`, { defaultValue: tab.id })}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <div className="overflow-hidden rounded-2xl border border-border/50 bg-background shadow-2xl shadow-black/10">
            <div className="flex items-center gap-2 border-b border-border/50 bg-muted/50 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="size-3 rounded-full bg-red-400" />
                <div className="size-3 rounded-full bg-yellow-400" />
                <div className="size-3 rounded-full bg-green-400" />
              </div>
              <div className="ml-4 flex-1">
                <div className="mx-auto h-5 w-64 rounded-md bg-muted" />
              </div>
            </div>

            <div className="relative aspect-[16/9] bg-muted/30">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeTab}
                  src={activeTabData?.image}
                  alt={`LearnBase ${activeTab}`}
                  className="h-full w-full object-cover object-top"
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.4 }}
                />
              </AnimatePresence>
            </div>
          </div>

          <div className="absolute -bottom-8 left-1/2 -z-10 h-[60%] w-[80%] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        </motion.div>
      </div>
    </section>
  );
}
