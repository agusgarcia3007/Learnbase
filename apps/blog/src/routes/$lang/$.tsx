import { createFileRoute, notFound, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { source } from '@/lib/source';
import { useI18n } from '@/lib/i18n';
import browserCollections from 'fumadocs-mdx:collections/browser';
import type { Locale } from '@/lib/i18n';

const VALID_LOCALES = ['en', 'es', 'pt'] as const;

export const Route = createFileRoute('/$lang/$')({
  component: BlogPost,
  loader: async ({ params }) => {
    if (!VALID_LOCALES.includes(params.lang as Locale)) {
      throw notFound();
    }
    const slugs = [params.lang, ...(params._splat?.split('/') ?? [])];
    const data = await serverLoader({ data: slugs });
    await clientLoader.preload(data.path);
    return data;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return {};

    const lang = params.lang as Locale;
    const baseUrl = 'https://uselearnbase.com';
    const slug = params._splat || '';

    const localeMap: Record<Locale, string> = {
      en: 'en_US',
      es: 'es_ES',
      pt: 'pt_BR',
    };

    const links = [
      { rel: 'canonical', href: `${baseUrl}/${lang}/${slug}` },
    ];

    if (loaderData.translations) {
      if (loaderData.translations.en) {
        links.push({ rel: 'alternate', hrefLang: 'en', href: `${baseUrl}/en/${loaderData.translations.en}` });
      }
      if (loaderData.translations.es) {
        links.push({ rel: 'alternate', hrefLang: 'es', href: `${baseUrl}/es/${loaderData.translations.es}` });
      }
      if (loaderData.translations.pt) {
        links.push({ rel: 'alternate', hrefLang: 'pt', href: `${baseUrl}/pt/${loaderData.translations.pt}` });
      }
      const xDefault = loaderData.translations.en || slug;
      links.push({ rel: 'alternate', hrefLang: 'x-default', href: `${baseUrl}/en/${xDefault}` });
    }

    return {
      meta: [
        { title: `${loaderData.title} | LearnBase Blog` },
        { name: 'description', content: loaderData.description || '' },
        { property: 'og:title', content: loaderData.title },
        { property: 'og:description', content: loaderData.description || '' },
        { property: 'og:type', content: 'article' },
        { property: 'og:url', content: `${baseUrl}/${lang}/${slug}` },
        { property: 'og:locale', content: localeMap[lang] },
        ...(loaderData.image ? [{ property: 'og:image', content: loaderData.image }] : []),
        { property: 'article:author', content: loaderData.author },
        { property: 'article:published_time', content: loaderData.rawDate },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: loaderData.title },
        { name: 'twitter:description', content: loaderData.description || '' },
        ...(loaderData.image ? [{ name: 'twitter:image', content: loaderData.image }] : []),
      ],
      links,
    };
  },
});

const serverLoader = createServerFn({ method: 'GET' }).handler(async (ctx: { data: string[] }) => {
  const slugs = ctx.data;
  const page = source.getPage(slugs);
  if (!page) throw notFound();

  const lang = slugs[0] as Locale;
  const localeMap: Record<Locale, string> = {
    en: 'en-US',
    es: 'es-ES',
    pt: 'pt-BR',
  };

  return {
    path: page.path,
    lang,
    title: page.data.title,
    description: page.data.description,
    author: page.data.author,
    image: page.data.image,
    rawDate: new Date(page.data.date).toISOString(),
    date: new Date(page.data.date).toLocaleDateString(localeMap[lang], {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    translations: page.data.translations,
  };
});

const clientLoader = browserCollections.blog.createClientLoader({
  component({ default: MDX }) {
    return (
      <div className="prose prose-lg max-w-none dark:prose-invert">
        <MDX />
      </div>
    );
  },
});

function BlogPost() {
  const data = Route.useLoaderData();
  const { lang } = Route.useParams();
  const { t } = useI18n();
  const Content = clientLoader.getComponent(data.path);

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <Link
        to={`/${lang}`}
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
        {t('post.backToBlog')}
      </Link>

      <header className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{data.title}</h1>
        {data.description && (
          <p className="mt-6 text-xl leading-relaxed text-muted-foreground">{data.description}</p>
        )}
        <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{data.author}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={data.rawDate}>{data.date}</time>
        </div>
      </header>

      {data.image && (
        <img
          src={data.image}
          alt={data.title}
          className="mb-12 aspect-video w-full rounded-2xl object-cover"
        />
      )}

      <Content />
    </article>
  );
}
