import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/courses")({
  beforeLoad: ({ context }) => {
    if (!context.isCampus) {
      throw redirect({ to: "/" });
    }
  },
  component: CoursesLayout,
});

function CoursesLayout() {
  return <Outlet />;
}
