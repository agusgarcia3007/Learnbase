import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { TenantCard, type ShowcaseTenant } from "./tenant-card";

type TenantShowcaseProps = {
  tenants: ShowcaseTenant[];
};

export function TenantShowcase({ tenants }: TenantShowcaseProps) {
  const { t } = useTranslation();

  if (tenants.length === 0) {
    return null;
  }

  return (
    <section id="showcase" className="bg-[var(--landing-bg)] py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          className="mb-14 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-[var(--landing-text)] sm:text-4xl">
            {t("landing.showcase.title")}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[var(--landing-text-muted)]">
            {t("landing.showcase.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {tenants.map((tenant, index) => (
            <TenantCard key={tenant.id} tenant={tenant} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
