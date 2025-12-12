import { useTranslation } from "react-i18next";
import { Star } from "lucide-react";
import SplitText from "@/components/SplitText";

const testimonials = [
  {
    key: "maria",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=maria",
    rating: 5,
  },
  {
    key: "carlos",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=carlos",
    rating: 5,
  },
  {
    key: "ana",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ana",
    rating: 5,
  },
];

export function Testimonials() {
  const { t } = useTranslation();

  return (
    <section
      className="relative overflow-hidden bg-background py-24 md:py-32"
      aria-labelledby="testimonials-heading"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <SplitText
            text={t("landing.testimonials.title")}
            className="text-3xl font-bold tracking-tight md:text-4xl"
            delay={30}
            duration={0.6}
            splitType="words"
            tag="h2"
            id="testimonials-heading"
          />
          <p className="mt-4 text-muted-foreground">
            {t("landing.testimonials.subtitle")}
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.key}
              className="relative rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg"
            >
              <div className="mb-4 flex gap-1">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              <p className="mb-6 text-foreground/80">
                "{t(`landing.testimonials.items.${testimonial.key}.quote`)}"
              </p>

              <div className="flex items-center gap-3">
                <img
                  src={testimonial.avatar}
                  alt={t(`landing.testimonials.items.${testimonial.key}.name`)}
                  className="h-10 w-10 rounded-full bg-muted"
                  loading="lazy"
                />
                <div>
                  <p className="font-medium">
                    {t(`landing.testimonials.items.${testimonial.key}.name`)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t(`landing.testimonials.items.${testimonial.key}.role`)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
