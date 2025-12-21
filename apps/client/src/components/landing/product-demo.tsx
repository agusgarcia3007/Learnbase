import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export function ProductDemo() {
  const { t } = useTranslation();

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
              <img
                src="/images/ai-use-night.png"
                alt="LearnBase AI"
                className="hidden h-full w-full object-cover object-top dark:block"
              />
              <img
                src="/images/ai-use-day.png"
                alt="LearnBase AI"
                className="h-full w-full object-cover object-top dark:hidden"
              />
            </div>
          </div>

          <div className="absolute -bottom-8 left-1/2 -z-10 h-[60%] w-[80%] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        </motion.div>
      </div>
    </section>
  );
}
