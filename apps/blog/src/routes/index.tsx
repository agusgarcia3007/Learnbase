import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { source } from '@/lib/source';
import { useTranslation } from '@/lib/i18n';

export const Route = createFileRoute('/')({
  component: Home,
  loader: async () => {
    return await getPostsServerFn();
  },
});

const getPostsServerFn = createServerFn({ method: 'GET' }).handler(async () => {
  const pages = source.getPages();
  return pages
    .sort(
      (a, b) =>
        new Date(b.data.date).getTime() - new Date(a.data.date).getTime()
    )
    .map((page) => ({
      url: page.url,
      title: page.data.title,
      description: page.data.description,
      author: page.data.author,
      image: page.data.image,
      date: new Date(page.data.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    }));
});

function Home() {
  const posts = Route.useLoaderData();
  const { t } = useTranslation();

  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <img
          src="/images/day-landscape.webp"
          alt=""
          className="h-full w-full scale-110 object-cover opacity-30 dark:hidden"
        />
        <img
          src="/images/night-landscape.webp"
          alt=""
          className="hidden h-full w-full scale-110 object-cover opacity-40 dark:block"
        />
      </div>

      <div className="mx-auto max-w-6xl px-6 py-16">
        <header className="mb-16">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{t("home.title")}</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {t("home.subtitle")}
          </p>
        </header>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.url}
            to={post.url}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
          >
            {post.image ? (
              <div className="aspect-video overflow-hidden bg-muted">
                <img
                  src={post.image}
                  alt={post.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            ) : (
              <div className="aspect-video bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5" />
            )}
            <div className="flex flex-1 flex-col p-6">
              <h2 className="text-xl font-semibold leading-tight transition-colors group-hover:text-primary">
                {post.title}
              </h2>
              {post.description && (
                <p className="mt-3 line-clamp-2 flex-1 text-muted-foreground">
                  {post.description}
                </p>
              )}
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm text-muted-foreground">
                <span className="font-medium">{post.author}</span>
                <span>{post.date}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
    </>
  );
}
