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
};

type MetaTag =
  | { title: string }
  | { name: string; content: string }
  | { property: string; content: string };

type LinkTag = {
  rel: string;
  href: string;
  hreflang?: string;
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
}: SeoParams): HeadConfig {
  const fullTitle = title.includes("LearnBase")
    ? title
    : `${title} | LearnBase`;
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
    { property: "og:site_name", content: "LearnBase" },
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
        hreflang: locale,
        href: url,
      });
    }
  }

  links.push({
    rel: "alternate",
    hreflang: "x-default",
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
}: {
  title: string;
  description: string;
  slug: string;
  image?: string;
  price?: number;
  currency?: string;
  instructor?: string;
  locale?: string;
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
  });

  if (price !== undefined) {
    seo.meta.push({ property: "product:price:amount", content: String(price) });
    seo.meta.push({ property: "product:price:currency", content: currency });
  }

  return seo;
}
