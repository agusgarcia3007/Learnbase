import { aiRoutes } from "./ai";

import {
  dashboardRoutes,
  adminEnrollmentsRoutes,
  jobsRoutes,
} from "./backoffice";

import {
  authRoutes,
  featuresRoutes,
  instructorsRoutes,
  notificationsRoutes,
  profileRoutes,
  tenantsRoutes,
  uploadsRoutes,
  usersRoutes,
} from "./platform";

import { seoRoutes, waitlistRoutes, webhooksRoutes } from "./public";

import {
  analyticsRoutes,
  campusRoutes,
  cartRoutes,
  categoriesRoutes,
  certificatesRoutes,
  checkoutRoutes,
  coursesRoutes,
  documentsRoutes,
  enrollmentsRoutes,
  learnRoutes,
  modulesRoutes,
  payoutsRoutes,
  quizzesRoutes,
  revenueRoutes,
  subscriptionRoutes,
  videosRoutes,
} from "./tenant";

export const ROUTES = [
  // Public (no auth required)
  { path: "", name: "seo-routes", route: seoRoutes },
  { path: "/waitlist", name: "waitlist-routes", route: waitlistRoutes },
  { path: "/webhooks", name: "webhooks-routes", route: webhooksRoutes },

  // Platform (global, not tenant-specific)
  { path: "/auth", name: "auth-routes", route: authRoutes },
  { path: "/features", name: "features-routes", route: featuresRoutes },
  { path: "/instructors", name: "instructors-routes", route: instructorsRoutes },
  { path: "/notifications", name: "notifications-routes", route: notificationsRoutes },
  { path: "/profile", name: "profile-routes", route: profileRoutes },
  { path: "/tenants", name: "tenants-routes", route: tenantsRoutes },
  { path: "/uploads", name: "uploads-routes", route: uploadsRoutes },
  { path: "/users", name: "users-routes", route: usersRoutes },

  // Tenant (requires tenant context)
  { path: "/analytics", name: "analytics-routes", route: analyticsRoutes },
  { path: "/campus", name: "campus-routes", route: campusRoutes },
  { path: "/cart", name: "cart-routes", route: cartRoutes },
  { path: "/categories", name: "categories-routes", route: categoriesRoutes },
  { path: "/certificates", name: "certificates-routes", route: certificatesRoutes },
  { path: "/checkout", name: "checkout-routes", route: checkoutRoutes },
  { path: "/courses", name: "courses-routes", route: coursesRoutes },
  { path: "/documents", name: "documents-routes", route: documentsRoutes },
  { path: "/enrollments", name: "enrollments-routes", route: enrollmentsRoutes },
  { path: "/learn", name: "learn-routes", route: learnRoutes },
  { path: "/modules", name: "modules-routes", route: modulesRoutes },
  { path: "/payouts", name: "payouts-routes", route: payoutsRoutes },
  { path: "/quizzes", name: "quizzes-routes", route: quizzesRoutes },
  { path: "/revenue", name: "revenue-routes", route: revenueRoutes },
  { path: "/subscription", name: "subscription-routes", route: subscriptionRoutes },
  { path: "/videos", name: "videos-routes", route: videosRoutes },

  // Backoffice (superadmin only)
  { path: "/backoffice", name: "backoffice-routes", route: dashboardRoutes },
  { path: "/admin/enrollments", name: "admin-enrollments-routes", route: adminEnrollmentsRoutes },
  { path: "/jobs", name: "jobs-routes", route: jobsRoutes },

  // AI
  { path: "/ai", name: "ai-routes", route: aiRoutes },
];
