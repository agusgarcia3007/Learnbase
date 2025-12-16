const BASE_URL = "https://uselearnbase.com";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;
const LANDING_OG_IMAGE = `${BASE_URL}/api/og/home`;
const CAMPUS_OG_IMAGE = `${BASE_URL}/api/og/campus`;
const TWITTER_HANDLE = "@learnbase";

export { BASE_URL, LANDING_OG_IMAGE, CAMPUS_OG_IMAGE };

type SeoParams = {
  title: string;
  description: string;
  url?: string;
  image?: string;
  keywords?: string;
  type?: "website" | "article" | "product";
  locale?: string;
  noindex?: boolean;
  siteName?: string;
  baseUrl?: string;
};

type MetaTag =
  | { title: string }
  | { name: string; content: string }
  | { property: string; content: string };

type LinkTag = {
  rel: string;
  href: string;
  hrefLang?: string;
  crossOrigin?: "" | "anonymous" | "use-credentials";
  as?: string;
};

type HeadConfig = {
  meta: MetaTag[];
  links: LinkTag[];
};

export function createSeoMeta({
  title,
  description,
  url,
  image,
  keywords,
  type = "website",
  locale = "en",
  noindex = false,
  siteName = "LearnBase",
  baseUrl,
}: SeoParams): HeadConfig {
  const effectiveBaseUrl = baseUrl || BASE_URL;
  const fullTitle = title.includes(siteName)
    ? title
    : `${title} | ${siteName}`;
  const canonicalUrl = url || effectiveBaseUrl;
  const ogImage = image || DEFAULT_OG_IMAGE;

  const meta: MetaTag[] = [
    { title: fullTitle },
    { name: "description", content: description },
    { name: "author", content: siteName },
    { name: "theme-color", content: "#8b5cf6" },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: description },
    { property: "og:image", content: ogImage },
    { property: "og:url", content: canonicalUrl },
    { property: "og:type", content: type },
    { property: "og:locale", content: getOgLocale(locale) },
    { property: "og:site_name", content: siteName },
    ...getOgLocaleAlternates(locale),
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: fullTitle },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: ogImage },
    { name: "twitter:site", content: TWITTER_HANDLE },
    { name: "twitter:creator", content: TWITTER_HANDLE },
  ];

  if (keywords) {
    meta.push({ name: "keywords", content: keywords });
  }

  if (noindex) {
    meta.push({ name: "robots", content: "noindex, nofollow" });
  } else {
    meta.push({ name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1" });
  }

  const links: LinkTag[] = [{ rel: "canonical", href: canonicalUrl }];

  const alternateLocales = getAlternateUrls(canonicalUrl, locale);
  links.push(...alternateLocales);

  return { meta, links };
}

function getOgLocale(locale: string): string {
  const localeMap: Record<string, string> = {
    en: "en_US",
    es: "es_ES",
    pt: "pt_BR",
  };
  return localeMap[locale] || "en_US";
}

function getOgLocaleAlternates(currentLocale: string): MetaTag[] {
  const localeMap: Record<string, string> = {
    en: "en_US",
    es: "es_ES",
    pt: "pt_BR",
  };

  return Object.entries(localeMap)
    .filter(([locale]) => locale !== currentLocale)
    .map(([, ogLocale]) => ({
      property: "og:locale:alternate",
      content: ogLocale,
    }));
}

function getAlternateUrls(url: string, currentLocale: string): LinkTag[] {
  const locales = ["en", "es", "pt"];
  const links: LinkTag[] = [];

  for (const locale of locales) {
    if (locale !== currentLocale) {
      links.push({
        rel: "alternate",
        hrefLang: locale,
        href: url,
      });
    }
  }

  links.push({
    rel: "alternate",
    hrefLang: "x-default",
    href: url,
  });

  return links;
}

export function createCourseSeoMeta({
  title,
  description,
  slug,
  image,
  price,
  currency = "USD",
  instructor,
  locale = "en",
  siteName,
  useGeneratedOg = true,
  baseUrl,
}: {
  title: string;
  description: string;
  slug: string;
  image?: string;
  price?: number;
  currency?: string;
  instructor?: string;
  locale?: string;
  siteName?: string;
  useGeneratedOg?: boolean;
  baseUrl?: string;
}): HeadConfig {
  const effectiveBaseUrl = baseUrl || BASE_URL;
  const url = `${effectiveBaseUrl}/courses/${slug}`;
  const keywords = `${title} course, online course, learn ${title}, ${
    instructor || ""
  }`.trim();

  const ogImage = useGeneratedOg ? `${effectiveBaseUrl}/api/og/course/${slug}` : image;

  const seo = createSeoMeta({
    title,
    description,
    url,
    image: ogImage,
    keywords,
    type: "product",
    locale,
    siteName,
    baseUrl: effectiveBaseUrl,
  });

  if (price !== undefined) {
    seo.meta.push({ property: "product:price:amount", content: String(price) });
    seo.meta.push({ property: "product:price:currency", content: currency });
  }

  return seo;
}

export function createGoogleFontLinks(fonts: (string | undefined | null)[]): LinkTag[] {
  const uniqueFonts = [...new Set(fonts.filter((f): f is string => Boolean(f)))];
  if (uniqueFonts.length === 0) return [];

  const links: LinkTag[] = [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  ];

  for (const font of uniqueFonts) {
    links.push({
      rel: "stylesheet",
      href: `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;500;600;700&display=swap`,
    });
  }

  return links;
}

export function createFaviconLinks(faviconUrl: string | null | undefined): LinkTag[] {
  if (!faviconUrl) return [];

  return [
    { rel: "icon", href: faviconUrl },
    { rel: "apple-touch-icon", href: faviconUrl },
  ];
}

export function getLandingKeywords(locale: string): string {
  const keywords: Record<string, string> = {
    en: "AI course creator, create online course from video, sell courses online, course platform for creators, white-label course platform, corporate training platform, employee training LMS, online academy builder, course generator AI",
    es: "crear cursos online, plataforma de cursos con IA, academia online, vender cursos en linea, LMS para empresas, plataforma de capacitacion, crear academia virtual, generador de cursos IA",
    pt: "criar cursos online, plataforma de cursos com IA, academia online, vender cursos online, LMS para empresas, plataforma de treinamento, criar academia virtual, gerador de cursos IA",
  };
  return keywords[locale] || keywords.en;
}

export function getLandingMeta(locale: string): { title: string; description: string; keywords: string } {
  const meta: Record<string, { title: string; description: string; keywords: string }> = {
    en: {
      title: "LearnBase - Create Online Courses with AI | Academy Builder",
      description: "Upload videos and AI generates courses, quizzes & transcriptions automatically. White-label platform with custom domain for creators and businesses. Start free.",
      keywords: getLandingKeywords("en"),
    },
    es: {
      title: "LearnBase - Crea Cursos Online con IA | Plataforma de Academia",
      description: "Sube videos y la IA genera cursos, quizzes y transcripciones automaticamente. Plataforma white-label con dominio personalizado para creadores y empresas. Empieza gratis.",
      keywords: getLandingKeywords("es"),
    },
    pt: {
      title: "LearnBase - Crie Cursos Online com IA | Plataforma de Academia",
      description: "Envie videos e a IA gera cursos, quizzes e transcricoes automaticamente. Plataforma white-label com dominio personalizado para criadores e empresas. Comece gratis.",
      keywords: getLandingKeywords("pt"),
    },
  };
  return meta[locale] || meta.en;
}
