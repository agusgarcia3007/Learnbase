import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { i18n } from './i18n';

export function baseOptions(lang?: string): BaseLayoutProps {
  const locale = lang || i18n.defaultLanguage;
  return {
    nav: {
      title: 'Learnbase',
    },
    links: [
      {
        text: 'Docs',
        url: `/${locale}/docs`,
      },
    ],
  };
}
