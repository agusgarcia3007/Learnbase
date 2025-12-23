import { loader } from 'fumadocs-core/source';
import { toFumadocsSource } from 'fumadocs-mdx/runtime/server';
import { blog } from 'fumadocs-mdx:collections/server';

export const source = loader({
  baseUrl: '/blog',
  source: toFumadocsSource(blog, []),
});
