import { createFileRoute, notFound, useParams } from '@tanstack/react-router';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { createServerFn } from '@tanstack/react-start';
import { source } from '@/lib/source';
import browserCollections from 'fumadocs-mdx:collections/browser';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/layouts/docs/page';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { baseOptions } from '@/lib/layout.shared';
import { useFumadocsLoader } from 'fumadocs-core/source/client';
import { i18n } from '@/lib/i18n';

export const Route = createFileRoute('/$lang/docs/$')({
  component: Page,
  loader: async ({ params }) => {
    const slugs = params._splat?.split('/') ?? [];
    const lang = i18n.languages.includes(params.lang) ? params.lang : i18n.defaultLanguage;
    const data = await serverLoader({ data: { slugs, lang } });
    await clientLoader.preload(data.path);
    return { ...data, lang };
  },
});

const serverLoader = createServerFn({
  method: 'GET',
})
  .inputValidator((input: { slugs: string[]; lang: string }) => input)
  .handler(async ({ data: { slugs, lang } }) => {
    const page = source.getPage(slugs, lang);
    if (!page) throw notFound();

    return {
      path: page.path,
      pageTree: await source.serializePageTree(source.getPageTree(lang)),
    };
  });

const clientLoader = browserCollections.docs.createClientLoader({
  component({ toc, frontmatter, default: MDX }) {
    return (
      <DocsPage toc={toc}>
        <DocsTitle>{frontmatter.title}</DocsTitle>
        <DocsDescription>{frontmatter.description}</DocsDescription>
        <DocsBody>
          <MDX components={{ ...defaultMdxComponents }} />
        </DocsBody>
      </DocsPage>
    );
  },
});

function Page() {
  const { lang } = useParams({ from: '/$lang/docs/$' });
  const data = Route.useLoaderData();
  const { pageTree } = useFumadocsLoader(data);
  const Content = clientLoader.getComponent(data.path);
  const locale = i18n.languages.includes(lang) ? lang : i18n.defaultLanguage;

  return (
    <DocsLayout {...baseOptions(locale)} tree={pageTree}>
      <Content />
    </DocsLayout>
  );
}
