import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import SplitText from "@/components/SplitText";

const faqItems = ["ai", "domain", "data"];

export function FAQ() {
  const { t } = useTranslation();

  return (
    <section
      id="faq"
      className="relative overflow-hidden bg-background py-24 md:py-32"
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-3xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <SplitText
            text={t("landing.faq.title")}
            className="text-3xl font-bold tracking-tight md:text-4xl"
            delay={30}
            duration={0.6}
            splitType="words"
            tag="h2"
            id="faq-heading"
          />
          <p className="mt-4 text-muted-foreground">
            {t("landing.faq.subtitle")}
          </p>
        </div>

        <div className="mt-12">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item) => (
              <AccordionItem key={item} value={item}>
                <AccordionTrigger className="text-left text-base font-medium">
                  {t(`landing.faq.items.${item}.question`)}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {t(`landing.faq.items.${item}.answer`)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
