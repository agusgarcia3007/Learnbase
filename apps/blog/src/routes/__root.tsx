import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  useParams,
} from '@tanstack/react-router';
import type { ReactNode } from 'react';
import appCss from '@/styles/app.css?url';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ThemeProvider } from '@/components/theme-provider';
import { I18nProvider } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';

const themeScript = `
(function() {
  const theme = localStorage.getItem('blog-theme') || 'system';
  if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Learnbase Blog',
      },
    ],
    links: [
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      { rel: 'icon', type: 'image/png', href: '/favicon-96x96.png', sizes: '96x96' },
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico', sizes: '48x48' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png', sizes: '180x180' },
      { rel: 'stylesheet', href: appCss },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap',
      },
    ],
    scripts: [
      {
        children: themeScript,
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <ThemeProvider defaultTheme="system">
      <RootDocument>
        <Outlet />
      </RootDocument>
    </ThemeProvider>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  const params = useParams({ strict: false }) as { lang?: Locale };
  const lang = params.lang || 'en';

  return (
    <I18nProvider defaultLocale={lang}>
      <html lang={lang} suppressHydrationWarning>
        <head>
          <HeadContent />
        </head>
        <body className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <Scripts />
        </body>
      </html>
    </I18nProvider>
  );
}
