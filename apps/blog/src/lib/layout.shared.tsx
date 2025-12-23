import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: 'Learnbase Blog',
    },
    links: [
      {
        text: 'Blog',
        url: '/blog',
      },
    ],
  };
}
