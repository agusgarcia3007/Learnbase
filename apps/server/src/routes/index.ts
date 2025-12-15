import { adminEnrollmentsRoutes } from "./admin-enrollments";
import { aiRoutes } from "./ai";
import { analyticsRoutes } from "./analytics";
import { authRoutes } from "./auth";
import { backofficeRoutes } from "./backoffice";
import { campusRoutes } from "./campus";
import { cartRoutes } from "./cart";
import { categoriesRoutes } from "./categories";
import { certificatesRoutes } from "./certificates";
import { coursesRoutes } from "./courses";
import { documentsRoutes } from "./documents";
import { enrollmentsRoutes } from "./enrollments";
import { instructorsRoutes } from "./instructors";
import { learnRoutes } from "./learn";
import { modulesRoutes } from "./modules";
import { profileRoutes } from "./profile";
import { quizzesRoutes } from "./quizzes";
import { seoRoutes } from "./seo";
import { tenantsRoutes } from "./tenants";
import { usersRoutes } from "./users";
import { videosRoutes } from "./videos";
import { waitlistRoutes } from "./waitlist";

export const ROUTES = [
  { path: "", name: "seo-routes", route: seoRoutes },
  { path: "/analytics", name: "analytics-routes", route: analyticsRoutes },
  { path: "/admin/enrollments", name: "admin-enrollments-routes", route: adminEnrollmentsRoutes },
  { path: "/ai", name: "ai-routes", route: aiRoutes },
  { path: "/auth", name: "auth-routes", route: authRoutes },
  { path: "/backoffice", name: "backoffice-routes", route: backofficeRoutes },
  { path: "/campus", name: "campus-routes", route: campusRoutes },
  { path: "/cart", name: "cart-routes", route: cartRoutes },
  { path: "/categories", name: "categories-routes", route: categoriesRoutes },
  { path: "/certificates", name: "certificates-routes", route: certificatesRoutes },
  { path: "/courses", name: "courses-routes", route: coursesRoutes },
  { path: "/documents", name: "documents-routes", route: documentsRoutes },
  { path: "/enrollments", name: "enrollments-routes", route: enrollmentsRoutes },
  { path: "/instructors", name: "instructors-routes", route: instructorsRoutes },
  { path: "/learn", name: "learn-routes", route: learnRoutes },
  { path: "/modules", name: "modules-routes", route: modulesRoutes },
  { path: "/profile", name: "profile-routes", route: profileRoutes },
  { path: "/quizzes", name: "quizzes-routes", route: quizzesRoutes },
  { path: "/tenants", name: "tenants-routes", route: tenantsRoutes },
  { path: "/users", name: "users-routes", route: usersRoutes },
  { path: "/videos", name: "videos-routes", route: videosRoutes },
  { path: "/waitlist", name: "waitlist-routes", route: waitlistRoutes },
];
