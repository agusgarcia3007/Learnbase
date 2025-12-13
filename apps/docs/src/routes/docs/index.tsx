import { createFileRoute, Navigate } from '@tanstack/react-router';

export const Route = createFileRoute('/docs/')({
  component: () => <Navigate to="/$lang/docs/$" params={{ lang: 'en', _splat: '' }} />,
});
