import { createFileRoute, notFound } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { source } from '@/lib/source';
import browserCollections from 'fumadocs-mdx:collections/browser';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { baseOptions } from '@/lib/layout.shared';
import { InlineTOC } from 'fumadocs-ui/components/inline-toc';

export const Route = createFileRoute('/blog/$')({
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
      date: new Date(page.data.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    };
  });

const clientLoader = browserCollections.blog.createClientLoader({
  component({ toc, default: MDX }) {
    return (
      <>
        <InlineTOC items={toc} />
        <div className="prose prose-neutral dark:prose-invert max-w-none mt-8">
          <MDX components={{ ...defaultMdxComponents }} />
        </div>
      </>
    );
  },
});

function BlogPost() {
  const data = Route.useLoaderData();
  const Content = clientLoader.getComponent(data.path);

  return (
    <HomeLayout {...baseOptions()}>
      <article className="container max-w-3xl py-12">
        <header className="mb-8">
          <h1 className="text-4xl font-bold">{data.title}</h1>
          {data.description && (
            <p className="text-xl text-fd-muted-foreground mt-4">
              {data.description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-6 text-sm text-fd-muted-foreground">
            <span>{data.author}</span>
            <span>{data.date}</span>
          </div>
        </header>
        <Content />
      </article>
    </HomeLayout>
  );
}
