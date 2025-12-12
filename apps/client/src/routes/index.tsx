import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CampusHeader } from "@/components/campus/header";
import { CampusFooter } from "@/components/campus/footer";
import { HeroSection } from "@/components/campus/hero-section";
import { CourseGrid } from "@/components/campus/course-grid";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import {
  LandingHeader,
  LandingHeroV2,
  LandingFeatures,
  LandingFooter,
  ProblemSolution,
  HowItWorks,
  Stats,
  Testimonials,
  Pricing,
  FAQ,
  FinalCTA,
} from "@/components/landing";
import { getMainDomainUrl, setResolvedSlug } from "@/lib/tenant";
import { cn } from "@/lib/utils";
import { loadGoogleFont } from "@/hooks/use-custom-theme";
import { BookOpen } from "lucide-react";
import { createSeoMeta, createGoogleFontLinks } from "@/lib/seo";
import {
  createOrganizationSchema,
  createWebSiteSchema,
  createSoftwareApplicationSchema,
} from "@/lib/json-ld";
import { getTenantFromRequest } from "@/lib/tenant.server";
import {
  getCampusTenantServer,
  getCampusCoursesServer,
  getCampusStatsServer,
} from "@/services/campus/server";
import type {
  CampusTenant,
  CampusCourse,
  CampusStats,
} from "@/services/campus/service";
import type { CustomTheme, TenantMode } from "@/services/tenants/service";

type CustomThemeStyles = React.CSSProperties & Record<string, string | undefined>;

function computeCustomStyles(
  customTheme: CustomTheme | null | undefined,
  mode: TenantMode | null
): CustomThemeStyles | undefined {
  if (!customTheme) return undefined;

  const isDark = mode === "dark";

  const get = <K extends keyof CustomTheme>(
    lightKey: K,
    darkKey: K
  ): string | undefined => {
    const value = isDark ? customTheme[darkKey] : customTheme[lightKey];
    return value || undefined;
  };

  return {
    "--background": get("background", "backgroundDark"),
    "--foreground": get("foreground", "foregroundDark"),
    "--card": get("card", "cardDark"),
    "--card-foreground": get("cardForeground", "cardForegroundDark"),
    "--popover": get("popover", "popoverDark"),
    "--popover-foreground": get("popoverForeground", "popoverForegroundDark"),
    "--primary": get("primary", "primaryDark"),
    "--primary-foreground": get("primaryForeground", "primaryForegroundDark"),
    "--secondary": get("secondary", "secondaryDark"),
    "--secondary-foreground": get("secondaryForeground", "secondaryForegroundDark"),
    "--muted": get("muted", "mutedDark"),
    "--muted-foreground": get("mutedForeground", "mutedForegroundDark"),
    "--accent": get("accent", "accentDark"),
    "--accent-foreground": get("accentForeground", "accentForegroundDark"),
    "--destructive": get("destructive", "destructiveDark"),
    "--destructive-foreground": get("destructiveForeground", "destructiveForegroundDark"),
    "--border": get("border", "borderDark"),
    "--input": get("input", "inputDark"),
    "--ring": get("ring", "ringDark"),
    "--chart-1": get("chart1", "chart1Dark"),
    "--chart-2": get("chart2", "chart2Dark"),
    "--chart-3": get("chart3", "chart3Dark"),
    "--chart-4": get("chart4", "chart4Dark"),
    "--chart-5": get("chart5", "chart5Dark"),
    "--sidebar": get("sidebar", "sidebarDark"),
    "--sidebar-foreground": get("sidebarForeground", "sidebarForegroundDark"),
    "--sidebar-primary": get("sidebarPrimary", "sidebarPrimaryDark"),
    "--sidebar-primary-foreground": get("sidebarPrimaryForeground", "sidebarPrimaryForegroundDark"),
    "--sidebar-accent": get("sidebarAccent", "sidebarAccentDark"),
    "--sidebar-accent-foreground": get("sidebarAccentForeground", "sidebarAccentForegroundDark"),
    "--sidebar-border": get("sidebarBorder", "sidebarBorderDark"),
    "--sidebar-ring": get("sidebarRing", "sidebarRingDark"),
    "--shadow": get("shadow", "shadowDark"),
    "--shadow-lg": get("shadowLg", "shadowLgDark"),
    "--radius": customTheme.radius || undefined,
    "--font-sans": customTheme.fontBody
      ? `"${customTheme.fontBody}", ui-sans-serif, system-ui, sans-serif`
      : undefined,
    "--font-heading": customTheme.fontHeading
      ? `"${customTheme.fontHeading}", sans-serif`
      : undefined,
  };
}

const landingSeo = createSeoMeta({
  title: "LearnBase - Create Your AI-Powered Online Academy",
  description:
    "Create and sell online courses with artificial intelligence. The all-in-one platform to launch your digital academy, manage students, and scale your educational business.",
  keywords:
    "create online academy, online course platform, AI LMS, sell courses online, academy builder, e-learning platform",
  url: "https://uselearnbase.com",
});

type LoaderData = {
  isCampus: boolean;
  slug: string | null;
  tenant: CampusTenant | null;
  courses: CampusCourse[] | null;
  stats: CampusStats | null;
  themeClass: string;
  customStyles: CustomThemeStyles | undefined;
};

export const Route = createFileRoute("/")({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => ({
    campus: (search.campus as string) || undefined,
  }),
  loaderDeps: ({ search }) => ({ campusSlug: search.campus }),
  loader: async ({ deps }): Promise<LoaderData> => {
    const tenantInfo = await getTenantFromRequest({ data: { campusSlug: deps.campusSlug } });

    if (!tenantInfo.isCampus) {
      return { isCampus: false, slug: null, tenant: null, courses: null, stats: null, themeClass: "", customStyles: undefined };
    }

    if (!tenantInfo.slug) {
      return { isCampus: true, slug: null, tenant: null, courses: null, stats: null, themeClass: "", customStyles: undefined };
    }

    const [tenantData, coursesData, statsData] = await Promise.all([
      getCampusTenantServer({ data: { slug: tenantInfo.slug } }),
      getCampusCoursesServer({ data: { slug: tenantInfo.slug, limit: 8 } }),
      getCampusStatsServer({ data: { slug: tenantInfo.slug } }),
    ]);

    const tenant = tenantData.tenant;
    const usePresetTheme = tenant.theme !== null && tenant.theme !== undefined;
    const themeClass = usePresetTheme ? `theme-${tenant.theme}` : "";
    const customStyles = usePresetTheme ? undefined : computeCustomStyles(tenant.customTheme, tenant.mode);

    return {
      isCampus: true,
      slug: tenantInfo.slug,
      tenant,
      courses: coursesData.courses,
      stats: statsData.stats,
      themeClass,
      customStyles,
    };
  },
  head: ({ loaderData }) => {
    if (loaderData?.tenant) {
      const customTheme = loaderData.tenant.customTheme;
      const fontLinks = createGoogleFontLinks([
        customTheme?.fontHeading,
        customTheme?.fontBody,
      ]);
      return {
        meta: [
          { charSet: "utf-8" },
          { name: "viewport", content: "width=device-width, initial-scale=1" },
          { title: loaderData.tenant.seoTitle || loaderData.tenant.name },
          { name: "description", content: loaderData.tenant.seoDescription || "" },
          { name: "keywords", content: loaderData.tenant.seoKeywords || "" },
        ],
        links: fontLinks,
      };
    }
    return {
      ...landingSeo,
      scripts: [
        createOrganizationSchema(),
        createWebSiteSchema(),
        createSoftwareApplicationSchema(),
      ],
    };
  },
});

function RouteComponent() {
  const data = Route.useLoaderData();

  useEffect(() => {
    if (data.slug) {
      setResolvedSlug(data.slug);
    }
  }, [data.slug]);

  if (data.isCampus) {
    if (!data.tenant) {
      return <CampusNotFound />;
    }
    return (
      <CampusHome
        tenant={data.tenant}
        courses={data.courses}
        stats={data.stats}
        themeClass={data.themeClass}
        customStyles={data.customStyles}
      />
    );
  }

  return <MainHome />;
}

function MainHome() {
  return (
    <div className="min-h-screen">
      <LandingHeader />
      <main>
        <LandingHeroV2 />
        <ProblemSolution />
        <HowItWorks />
        <Stats />
        <LandingFeatures />
        <Testimonials />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}

type CampusHomeProps = {
  tenant: CampusTenant;
  courses: CampusCourse[] | null;
  stats: CampusStats | null;
  themeClass: string;
  customStyles: CustomThemeStyles | undefined;
};

function CampusHome({ tenant, courses, stats, themeClass, customStyles }: CampusHomeProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (tenant.customTheme?.fontHeading) {
      loadGoogleFont(tenant.customTheme.fontHeading);
    }
    if (tenant.customTheme?.fontBody && tenant.customTheme.fontBody !== tenant.customTheme.fontHeading) {
      loadGoogleFont(tenant.customTheme.fontBody);
    }
  }, [tenant.customTheme?.fontHeading, tenant.customTheme?.fontBody]);

  const hasCourses = courses && courses.length > 0;

  return (
    <div
      className={cn("flex min-h-screen flex-col", themeClass)}
      style={customStyles}
    >
      <CampusHeader tenant={tenant} />
      <main className="flex-1">
        <HeroSection tenant={tenant} stats={stats ?? undefined} />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          {hasCourses ? (
            <CourseGrid
              courses={courses}
              title="Cursos destacados"
              description="Explora nuestros cursos mas populares"
            />
          ) : (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BookOpen />
                </EmptyMedia>
                <EmptyTitle>{t("campus.empty.title")}</EmptyTitle>
                <EmptyDescription>
                  {t("campus.empty.description")}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </section>
      </main>
      <CampusFooter tenant={tenant} />
    </div>
  );
}

function CampusNotFound() {
  const { t } = useTranslation();
  const mainDomainUrl = getMainDomainUrl();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 text-6xl font-bold text-muted-foreground/30">
          404
        </div>
        <h1 className="mb-3 text-2xl font-semibold text-foreground">
          {t("campusNotFound.title")}
        </h1>
        <p className="mb-2 text-muted-foreground">
          {t("campusNotFound.description")}
        </p>
        <p className="mb-8 text-sm text-muted-foreground">
          {t("campusNotFound.hint")}
        </p>

        <a href={mainDomainUrl}>
          <Button>{t("campusNotFound.goToMain")} </Button>
        </a>
      </div>
    </div>
  );
}
