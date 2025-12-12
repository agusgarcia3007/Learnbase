import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { getTenantFromRequest } from "@/lib/tenant.server";

export const Route = createFileRoute("/courses")({
  validateSearch: (search: Record<string, unknown>) => ({
    campus: (search.campus as string) || undefined,
  }),
  loaderDeps: ({ search }) => ({ campusSlug: search.campus }),
  loader: async ({ deps }) => {
    const tenantInfo = await getTenantFromRequest({ data: { campusSlug: deps.campusSlug } });
    return { isCampus: tenantInfo.isCampus };
  },
  component: CoursesLayout,
});

function CoursesLayout() {
  const { isCampus } = Route.useLoaderData();

  if (!isCampus) {
    return <Navigate to="/" search={{ campus: undefined }} />;
  }

  return <Outlet />;
}
