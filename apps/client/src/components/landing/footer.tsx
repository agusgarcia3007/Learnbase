import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LearnbaseLogo } from "./logo";

export function LandingFooter() {
  const { t } = useTranslation();

  const footerSections = [
    {
      title: t("landing.footer.sections.product.title"),
      links: [
        { label: t("landing.footer.sections.product.features"), href: "#features" },
        { label: t("landing.footer.sections.product.pricing"), href: "#pricing" },
        { label: t("landing.footer.sections.product.integrations"), href: "#" },
        { label: t("landing.footer.sections.product.updates"), href: "#" },
      ],
    },
    {
      title: t("landing.footer.sections.resources.title"),
      links: [
        { label: t("landing.footer.sections.resources.helpCenter"), href: "#" },
        { label: t("landing.footer.sections.resources.documentation"), href: "#" },
        { label: t("landing.footer.sections.resources.blog"), href: "#" },
        { label: t("landing.footer.sections.resources.community"), href: "#" },
      ],
    },
    {
      title: t("landing.footer.sections.company.title"),
      links: [
        { label: t("landing.footer.sections.company.about"), href: "#" },
        { label: t("landing.footer.sections.company.careers"), href: "#" },
        { label: t("landing.footer.sections.company.contact"), href: "#" },
        { label: t("landing.footer.sections.company.partners"), href: "#" },
      ],
    },
    {
      title: t("landing.footer.sections.legal.title"),
      links: [
        { label: t("landing.footer.sections.legal.privacy"), href: "#" },
        { label: t("landing.footer.sections.legal.terms"), href: "#" },
        { label: t("landing.footer.sections.legal.cookies"), href: "#" },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5">
              <LearnbaseLogo className="h-7 w-7" />
              <span className="text-[15px] font-semibold tracking-tight text-foreground">
                Learnbase
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t("landing.footer.description")}
            </p>
            <div className="mt-5 flex gap-3">
              <a
                href="#"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                aria-label="Twitter"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="#"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                aria-label="LinkedIn"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a
                href="#"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                aria-label="YouTube"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <p className="text-center text-xs text-muted-foreground">
            {t("landing.footer.copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
}
