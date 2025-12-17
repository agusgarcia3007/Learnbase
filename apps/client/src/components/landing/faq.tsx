import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqItems = ["ai", "domain", "data", "pricing"];

export function FAQ() {
  const { t } = useTranslation();

  return (
    <section id="faq" className="py-24">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          {t("landing.faq.title")}
        </h2>

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
