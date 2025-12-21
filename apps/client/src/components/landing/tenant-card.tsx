import { motion } from "framer-motion";
import { GraduationCap, Users, BookOpen, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";

export type ShowcaseTenant = {
  id: string;
  slug: string;
  name: string;
  logo: string | null;
  description: string | null;
  theme: string | null;
  usersCount: number;
  coursesCount: number;
};

type TenantCardProps = {
  tenant: ShowcaseTenant;
  index?: number;
};

export function TenantCard({ tenant, index = 0 }: TenantCardProps) {
  const { t } = useTranslation();
  const academyUrl = `https://${tenant.slug}.uselearnbase.com`;

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <motion.article
          className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-card)] p-6 transition-shadow duration-300 hover:shadow-xl hover:shadow-black/8"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.08 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--landing-accent)]/3 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="relative z-10 mb-5 flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--landing-accent-light)] ring-1 ring-[var(--landing-border)]">
              {tenant.logo ? (
                <img
                  src={tenant.logo}
                  alt={tenant.name}
                  className="size-full object-cover"
                />
              ) : (
                <GraduationCap className="size-7 text-[var(--landing-accent)]" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-semibold text-[var(--landing-text)] transition-colors duration-200 group-hover:text-[var(--landing-accent)]">
                {tenant.name}
              </h3>
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[var(--landing-text-muted)]">
                {tenant.description || "Online learning platform"}
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-auto flex items-center gap-5 border-t border-[var(--landing-border)]/60 pt-4 text-xs text-[var(--landing-text-muted)]">
            <div className="flex items-center gap-1.5">
              <BookOpen className="size-3.5" />
              <span className="font-medium text-[var(--landing-text)]">
                {tenant.coursesCount}
              </span>
              <span>{t("landing.showcase.courses")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="size-3.5" />
              <span className="font-medium text-[var(--landing-text)]">
                {tenant.usersCount}
              </span>
              <span>{t("landing.showcase.students")}</span>
            </div>
          </div>
        </motion.article>
      </HoverCardTrigger>

      <HoverCardContent
        align="center"
        side="top"
        sideOffset={8}
        className="w-80 border-[var(--landing-border)] bg-[var(--landing-card)] p-5"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--landing-accent-light)] ring-1 ring-[var(--landing-border)]">
              {tenant.logo ? (
                <img
                  src={tenant.logo}
                  alt={tenant.name}
                  className="size-full object-cover"
                />
              ) : (
                <GraduationCap className="size-8 text-[var(--landing-accent)]" />
              )}
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-[var(--landing-text)]">
                {tenant.name}
              </h4>
              <div className="mt-1 flex items-center gap-3 text-xs text-[var(--landing-text-muted)]">
                <span>
                  {tenant.coursesCount} {t("landing.showcase.courses")}
                </span>
                <span className="size-1 rounded-full bg-[var(--landing-border)]" />
                <span>
                  {tenant.usersCount} {t("landing.showcase.students")}
                </span>
              </div>
            </div>
          </div>

          {tenant.description && (
            <p className="text-sm leading-relaxed text-[var(--landing-text-muted)]">
              {tenant.description}
            </p>
          )}

          <Button asChild size="sm" className="w-full gap-2">
            <a href={academyUrl} target="_blank" rel="noopener noreferrer">
              {t("landing.showcase.visitCta")}
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
