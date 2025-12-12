const BASE_URL = "https://uselearnbase.com";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;
const TWITTER_HANDLE = "@learnbase";

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
}: SeoParams): HeadConfig {
  const fullTitle = title.includes(siteName)
    ? title
    : `${title} | ${siteName}`;
  const canonicalUrl = url || BASE_URL;
  const ogImage = image || DEFAULT_OG_IMAGE;

  const meta: MetaTag[] = [
    { title: fullTitle },
    { name: "description", content: description },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: description },
    { property: "og:image", content: ogImage },
    { property: "og:url", content: canonicalUrl },
    { property: "og:type", content: type },
    { property: "og:locale", content: getOgLocale(locale) },
    { property: "og:site_name", content: siteName },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: fullTitle },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: ogImage },
    { name: "twitter:site", content: TWITTER_HANDLE },
  ];

  if (keywords) {
    meta.push({ name: "keywords", content: keywords });
  }

  if (noindex) {
    meta.push({ name: "robots", content: "noindex, nofollow" });
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
}): HeadConfig {
  const url = `${BASE_URL}/courses/${slug}`;
  const keywords = `${title} course, online course, learn ${title}, ${
    instructor || ""
  }`.trim();

  const seo = createSeoMeta({
    title,
    description,
    url,
    image,
    keywords,
    type: "product",
    locale,
    siteName,
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
