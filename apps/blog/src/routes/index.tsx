import { createFileRoute, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';

type SupportedLocale = 'en' | 'es' | 'pt';

export const Route = createFileRoute('/')({
  loader: async () => {
    const lang = await detectLanguageServerFn();
    throw redirect({ to: '/$lang', params: { lang } });
  },
  component: () => null,
});

const detectLanguageServerFn = createServerFn({ method: 'GET' }).handler(async (): Promise<SupportedLocale> => {
  const headers = getRequestHeaders();
  const acceptLanguage = headers?.get('accept-language') || '';
  const browserLang = acceptLanguage.split(',')[0]?.split('-')[0]?.toLowerCase();

  const supportedLocales: SupportedLocale[] = ['en', 'es', 'pt'];
  if (browserLang && supportedLocales.includes(browserLang as SupportedLocale)) {
    return browserLang as SupportedLocale;
  }

  return 'en';
});
