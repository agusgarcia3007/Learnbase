import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { source } from '@/lib/source';
import { useI18n } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';

const VALID_LOCALES = ['en', 'es', 'pt'] as const;

export const Route = createFileRoute('/$lang/')({
  component: LanguageHome,
  loader: async ({ params }) => {
    if (!VALID_LOCALES.includes(params.lang as Locale)) {
      throw notFound();
    }
    return await getPostsServerFn({ data: params.lang });
  },
  head: ({ loaderData, params }) => {
    const lang = params.lang as Locale;
    const titles: Record<Locale, string> = {
      en: 'LearnBase Blog - AI-Powered Course Creation',
      es: 'Blog LearnBase - Creacion de Cursos con IA',
      pt: 'Blog LearnBase - Criacao de Cursos com IA',
    };
    const descriptions: Record<Locale, string> = {
      en: 'Learn how to create online courses faster with AI. Tips, guides, and insights for content creators.',
      es: 'Aprende a crear cursos online mas rapido con IA. Tips, guias e insights para creadores de contenido.',
      pt: 'Aprenda a criar cursos online mais rapido com IA. Dicas, guias e insights para criadores de conteudo.',
    };
    const baseUrl = 'https://uselearnbase.com';

    return {
      meta: [
        { title: titles[lang] },
        { name: 'description', content: descriptions[lang] },
        { property: 'og:title', content: titles[lang] },
        { property: 'og:description', content: descriptions[lang] },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: `${baseUrl}/${lang}/` },
        { property: 'og:locale', content: lang === 'en' ? 'en_US' : lang === 'es' ? 'es_ES' : 'pt_BR' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: titles[lang] },
        { name: 'twitter:description', content: descriptions[lang] },
      ],
      links: [
        { rel: 'canonical', href: `${baseUrl}/${lang}/` },
        { rel: 'alternate', hrefLang: 'en', href: `${baseUrl}/en/` },
        { rel: 'alternate', hrefLang: 'es', href: `${baseUrl}/es/` },
        { rel: 'alternate', hrefLang: 'pt', href: `${baseUrl}/pt/` },
        { rel: 'alternate', hrefLang: 'x-default', href: `${baseUrl}/en/` },
      ],
    };
  },
});

const getPostsServerFn = createServerFn({ method: 'GET' }).handler(async (ctx: { data: string }) => {
  const lang = ctx.data;
  const pages = source.getPages();
  return pages
    .filter((page) => page.slugs[0] === lang)
    .sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime())
    .map((page) => ({
      url: page.url,
      slug: page.slugs.slice(1).join('/'),
      title: page.data.title,
      description: page.data.description,
      author: page.data.author,
      image: page.data.image,
      date: page.data.date,
    }));
  });

function CornerMarker({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const baseClasses = 'absolute w-3 h-3 pointer-events-none';
  const lineClasses = 'absolute bg-muted-foreground/40';

  const positions = {
    tl: '-top-px -left-px',
    tr: '-top-px -right-px',
    bl: '-bottom-px -left-px',
    br: '-bottom-px -right-px',
  };

  const horizontalLine = {
    tl: 'top-0 left-0 w-full h-px',
    tr: 'top-0 right-0 w-full h-px',
    bl: 'bottom-0 left-0 w-full h-px',
    br: 'bottom-0 right-0 w-full h-px',
  };

  const verticalLine = {
    tl: 'top-0 left-0 w-px h-full',
    tr: 'top-0 right-0 w-px h-full',
    bl: 'bottom-0 left-0 w-px h-full',
    br: 'bottom-0 right-0 w-px h-full',
  };

  return (
    <div className={`${baseClasses} ${positions[position]}`}>
      <span className={`${lineClasses} ${horizontalLine[position]}`} />
      <span className={`${lineClasses} ${verticalLine[position]}`} />
    </div>
  );
}

function GridFrame({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <CornerMarker position="tl" />
      <CornerMarker position="tr" />
      <CornerMarker position="bl" />
      <CornerMarker position="br" />
      {children}
    </div>
  );
}

function LanguageHome() {
  const posts = Route.useLoaderData();
  const { lang } = Route.useParams();
  const { t } = useI18n();

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    const localeMap: Record<Locale, string> = {
      en: 'en-US',
      es: 'es-ES',
      pt: 'pt-BR',
    };
    return d.toLocaleDateString(localeMap[lang as Locale] || 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-6 pt-8 pb-24">
        <GridFrame className="mb-20">
          <div className="relative overflow-hidden rounded-sm">
            <div className="absolute inset-0">
              <img
                src="/images/day-landscape.webp"
                alt=""
                className="h-full w-full object-cover dark:hidden"
              />
              <img
                src="/images/night-landscape.webp"
                alt=""
                className="hidden h-full w-full object-cover dark:block"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            </div>

            <div className="relative px-8 py-16 md:px-12 md:py-24">
              <h1 className="font-display text-4xl font-medium tracking-tight text-white md:text-5xl lg:text-6xl">
                {t('home.title')}
              </h1>
              <p className="mt-4 max-w-lg font-mono text-sm text-white/70 md:text-base">
                {t('home.subtitle')}
              </p>
            </div>
          </div>
        </GridFrame>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, index) => (
            <Link key={post.url} to={post.url} className="group" style={{ animationDelay: `${index * 50}ms` }}>
              <GridFrame className="h-full">
                <article className="flex h-full flex-col overflow-hidden rounded-sm bg-card transition-all duration-300 group-hover:bg-muted/50">
                  <div className="relative overflow-hidden border-b border-border">
                    {post.image ? (
                      <div className="aspect-video overflow-hidden bg-muted">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-gradient-to-br from-muted via-muted/80 to-muted">
                        <div className="flex h-full items-center justify-center">
                          <span className="font-mono text-xs text-muted-foreground/50">
                            {post.title.slice(0, 20)}...
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h2 className="font-display text-lg font-medium leading-snug transition-colors group-hover:text-primary">
                      {post.title}
                    </h2>
                    {post.description && (
                      <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">{post.description}</p>
                    )}
                    <div className="mt-4 flex items-center justify-end">
                      <time
                        dateTime={new Date(post.date).toISOString()}
                        className="font-mono text-xs text-muted-foreground/70"
                      >
                        {formatDate(post.date)}
                      </time>
                    </div>
                  </div>
                </article>
              </GridFrame>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
