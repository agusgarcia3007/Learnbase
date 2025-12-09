import { useTranslation } from "react-i18next";
import CountUp from "@/components/CountUp";

const stats = [
  { key: "courses", value: 1200, suffix: "+" },
  { key: "students", value: 50000, suffix: "+" },
  { key: "satisfaction", value: 98, suffix: "%" },
  { key: "hours", value: 10000, suffix: "+" },
];

export function Stats() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden border-y border-border bg-muted/30 py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.key} className="text-center">
              <div className="text-4xl font-bold text-primary md:text-5xl">
                <CountUp
                  to={stat.value}
                  duration={2.5}
                  separator=","
                  className="tabular-nums"
                />
                <span>{stat.suffix}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {t(`landing.stats.${stat.key}`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
