import { authRoutes } from "./auth";
import { backofficeRoutes } from "./backoffice";
import { campusRoutes } from "./campus";
import { cartRoutes } from "./cart";
import { categoriesRoutes } from "./categories";
import { coursesRoutes } from "./courses";
import { documentsRoutes } from "./documents";
import { instructorsRoutes } from "./instructors";
import { lessonsRoutes } from "./lessons";
import { modulesRoutes } from "./modules";
import { profileRoutes } from "./profile";
import { quizzesRoutes } from "./quizzes";
import { tenantsRoutes } from "./tenants";
import { usersRoutes } from "./users";
import { videosRoutes } from "./videos";

export const ROUTES = [
  { path: "/auth", name: "auth-routes", route: authRoutes },
  { path: "/backoffice", name: "backoffice-routes", route: backofficeRoutes },
  { path: "/campus", name: "campus-routes", route: campusRoutes },
  { path: "/cart", name: "cart-routes", route: cartRoutes },
  { path: "/categories", name: "categories-routes", route: categoriesRoutes },
  { path: "/courses", name: "courses-routes", route: coursesRoutes },
  { path: "/documents", name: "documents-routes", route: documentsRoutes },
  { path: "/instructors", name: "instructors-routes", route: instructorsRoutes },
  { path: "/lessons", name: "lessons-routes", route: lessonsRoutes },
  { path: "/modules", name: "modules-routes", route: modulesRoutes },
  { path: "/profile", name: "profile-routes", route: profileRoutes },
  { path: "/quizzes", name: "quizzes-routes", route: quizzesRoutes },
  { path: "/tenants", name: "tenants-routes", route: tenantsRoutes },
  { path: "/users", name: "users-routes", route: usersRoutes },
  { path: "/videos", name: "videos-routes", route: videosRoutes },
];
