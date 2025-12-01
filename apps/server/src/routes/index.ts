import { authRoutes } from "./auth";
import { backofficeRoutes } from "./backoffice";
import { campusRoutes } from "./campus";
import { lessonsRoutes } from "./lessons";
import { modulesRoutes } from "./modules";
import { profileRoutes } from "./profile";
import { tenantsRoutes } from "./tenants";
import { usersRoutes } from "./users";

export const ROUTES = [
  { path: "/auth", name: "auth-routes", route: authRoutes },
  { path: "/backoffice", name: "backoffice-routes", route: backofficeRoutes },
  { path: "/campus", name: "campus-routes", route: campusRoutes },
  { path: "/lessons", name: "lessons-routes", route: lessonsRoutes },
  { path: "/modules", name: "modules-routes", route: modulesRoutes },
  { path: "/profile", name: "profile-routes", route: profileRoutes },
  { path: "/tenants", name: "tenants-routes", route: tenantsRoutes },
  { path: "/users", name: "users-routes", route: usersRoutes },
];
