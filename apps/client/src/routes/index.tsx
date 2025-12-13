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
  HowItWorks,
  Waitlist,
  FAQ,
} from "@/components/landing";
import { getMainDomainUrl, setResolvedSlug } from "@/lib/tenant";
import { cn } from "@/lib/utils";
import { loadGoogleFont } from "@/hooks/use-custom-theme";
import { BookOpen } from "lucide-react";
import { createSeoMeta, createGoogleFontLinks, createFaviconLinks } from "@/lib/seo";
import {
  createOrganizationSchema,
  createWebSiteSchema,
  createSoftwareApplicationSchema,
  createFAQSchema,
  createHowToSchema,
} from "@/lib/json-ld";
import { getTenantFromRequest } from "@/lib/tenant.server";
import { computeThemeStyles, type CustomThemeStyles } from "@/lib/theme.server";
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

const landingSeo = createSeoMeta({
  title: "LearnBase - Create Your AI-Powered Online Academy",
  description:
    "Create your AI-powered online academy in minutes. LearnBase auto-generates courses from videos, handles payments, and scales your educational business. Start free.",
  keywords:
    "create online courses with AI, AI course generator, white-label LMS, sell courses online platform, academy builder software, online course platform, e-learning platform",
  url: "https://uselearnbase.com",
});

const landingFaqData = [
  {
    question: "How does the AI work?",
    answer: "Upload a video and our AI analyzes it. It extracts audio, transcribes it, identifies main topics, and generates title, description, and quiz questions. All automatic.",
  },
  {
    question: "Can I use my own domain?",
    answer: "Yes. Connect your domain and your academy looks 100% yours.",
  },
  {
    question: "Is my data secure?",
    answer: "Your data is yours. We don't share it with third parties or use it to train models.",
  },
];

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
    const { themeClass, customStyles } = computeThemeStyles(tenant);

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
      const tenant = loaderData.tenant;
      const customTheme = tenant.customTheme;
      const fontLinks = createGoogleFontLinks([
        customTheme?.fontHeading,
        customTheme?.fontBody,
      ]);
      const faviconLinks = createFaviconLinks(tenant.favicon);
      return {
        meta: [
          { charSet: "utf-8" },
          { name: "viewport", content: "width=device-width, initial-scale=1" },
          { title: tenant.seoTitle || tenant.name },
          { name: "description", content: tenant.seoDescription || "" },
          { name: "keywords", content: tenant.seoKeywords || "" },
        ],
        links: [...fontLinks, ...faviconLinks],
      };
    }
    return {
      ...landingSeo,
      scripts: [
        createOrganizationSchema(),
        createWebSiteSchema(),
        createSoftwareApplicationSchema(),
        createFAQSchema(landingFaqData),
        createHowToSchema(),
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
        <HowItWorks />
        <LandingFeatures />
        <Waitlist />
        <FAQ />
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
