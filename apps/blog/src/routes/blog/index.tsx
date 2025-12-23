import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { source } from '@/lib/source';
import { baseOptions } from '@/lib/layout.shared';

export const Route = createFileRoute('/blog/')({
  component: BlogIndex,
  loader: async () => {
    return await getPostsServerFn();
  },
});

const getPostsServerFn = createServerFn({ method: 'GET' }).handler(async () => {
  const pages = source.getPages();
  return pages.map((page) => ({
    url: page.url,
    title: page.data.title,
    description: page.data.description,
    author: page.data.author,
    date: new Date(page.data.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  }));
});

function BlogIndex() {
  const posts = Route.useLoaderData();

  return (
    <HomeLayout {...baseOptions()}>
      <div className="container max-w-4xl py-12">
        <h1 className="text-3xl font-bold mb-8">Blog</h1>
        <div className="flex flex-col gap-6">
          {posts.map((post) => (
            <Link
              key={post.url}
              to={post.url}
              className="group p-6 border border-fd-border rounded-lg hover:bg-fd-accent transition-colors"
            >
              <h2 className="text-xl font-semibold group-hover:text-fd-primary transition-colors">
                {post.title}
              </h2>
              {post.description && (
                <p className="text-fd-muted-foreground mt-2">
                  {post.description}
                </p>
              )}
              <div className="flex items-center gap-4 mt-4 text-sm text-fd-muted-foreground">
                <span>{post.author}</span>
                <span>{post.date}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </HomeLayout>
  );
}
