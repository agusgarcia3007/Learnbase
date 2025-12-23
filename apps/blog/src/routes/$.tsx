import { createFileRoute, notFound, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { source } from '@/lib/source';
import { useTranslation } from '@/lib/i18n';
import browserCollections from 'fumadocs-mdx:collections/browser';

export const Route = createFileRoute('/$')({
  component: BlogPost,
  loader: async ({ params }) => {
    const slugs = params._splat?.split('/') ?? [];
    const data = await serverLoader({ data: slugs });
    await clientLoader.preload(data.path);
    return data;
  },
});

const serverLoader = createServerFn({ method: 'GET' })
  .inputValidator((slugs: string[]) => slugs)
  .handler(async ({ data: slugs }) => {
    const page = source.getPage(slugs);
    if (!page) throw notFound();

    return {
      path: page.path,
      title: page.data.title,
      description: page.data.description,
      author: page.data.author,
      image: page.data.image,
      date: new Date(page.data.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    };
  });

const clientLoader = browserCollections.blog.createClientLoader({
  component({ default: MDX }) {
    return (
      <div className="prose prose-lg max-w-none">
        <MDX />
      </div>
    );
  },
});

function BlogPost() {
  const data = Route.useLoaderData();
  const { t } = useTranslation();
  const Content = clientLoader.getComponent(data.path);

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <Link
        to="/"
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
        {t("post.backToBlog")}
      </Link>

      <header className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          {data.title}
        </h1>
        {data.description && (
          <p className="mt-6 text-xl leading-relaxed text-muted-foreground">
            {data.description}
          </p>
        )}
        <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{data.author}</span>
          <span aria-hidden="true">·</span>
          <time>{data.date}</time>
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
