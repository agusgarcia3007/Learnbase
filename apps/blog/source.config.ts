import { defineConfig, defineCollections, frontmatterSchema } from 'fumadocs-mdx/config';
import { z } from 'zod';

export const blog = defineCollections({
  type: 'doc',
  dir: 'content/blog',
  schema: frontmatterSchema.extend({
    author: z.string(),
    date: z.string().date().or(z.date()),
    image: z.string().optional(),
    translations: z
      .object({
        en: z.string().optional(),
        es: z.string().optional(),
        pt: z.string().optional(),
      })
      .optional(),
  }),
});

export default defineConfig();
