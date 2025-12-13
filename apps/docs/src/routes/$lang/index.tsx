import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import { i18n } from '@/lib/i18n';

export const Route = createFileRoute('/$lang/')({
  component: Home,
});

function Home() {
  const { lang } = useParams({ from: '/$lang/' });
  const locale = i18n.languages.includes(lang) ? lang : i18n.defaultLanguage;

  const texts = {
    en: {
      title: 'Welcome to Learnbase',
      subtitle: 'The complete platform for creating and managing online courses.',
      cta: 'View Documentation',
    },
    es: {
      title: 'Bienvenido a Learnbase',
      subtitle: 'La plataforma completa para crear y gestionar cursos online.',
      cta: 'Ver Documentación',
    },
    pt: {
      title: 'Bem-vindo ao Learnbase',
      subtitle: 'A plataforma completa para criar e gerenciar cursos online.',
      cta: 'Ver Documentação',
    },
  };

  const t = texts[locale as keyof typeof texts] || texts.en;

  return (
    <HomeLayout {...baseOptions(locale)}>
      <div className="flex flex-col flex-1 justify-center px-4 py-8 text-center">
        <h1 className="font-semibold text-2xl mb-2">{t.title}</h1>
        <p className="text-fd-muted-foreground mb-6">{t.subtitle}</p>
        <Link
          to="/$lang/docs/$"
          params={{ lang: locale, _splat: '' }}
          className="px-4 py-2 rounded-lg bg-fd-primary text-fd-primary-foreground font-medium text-sm mx-auto"
        >
          {t.cta}
        </Link>
      </div>
    </HomeLayout>
  );
}
