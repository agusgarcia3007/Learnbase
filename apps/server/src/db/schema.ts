import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "superadmin",
  "owner",
  "admin",
  "student",
]);

export const lessonTypeEnum = pgEnum("lesson_type", ["video", "text", "quiz"]);
export const lessonStatusEnum = pgEnum("lesson_status", ["draft", "published"]);
export const moduleStatusEnum = pgEnum("module_status", ["draft", "published"]);
export const courseLevelEnum = pgEnum("course_level", [
  "beginner",
  "intermediate",
  "advanced",
]);
export const courseStatusEnum = pgEnum("course_status", ["draft", "published"]);
export const tenantThemeEnum = pgEnum("tenant_theme", [
  "default",
  "slate",
  "rose",
  "emerald",
  "tangerine",
  "ocean",
]);

export const tenantsTable = pgTable(
  "tenants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    logo: text("logo"),
    theme: tenantThemeEnum("theme").default("default"),
    customDomain: text("custom_domain").unique(),
    customHostnameId: text("custom_hostname_id"),
    railwayDomainId: text("railway_domain_id"),
    description: text("description"),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    contactAddress: text("contact_address"),
    socialLinks: jsonb("social_links").$type<{
      twitter?: string;
      facebook?: string;
      instagram?: string;
      linkedin?: string;
      youtube?: string;
    }>(),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    seoKeywords: text("seo_keywords"),
    heroTitle: text("hero_title"),
    heroSubtitle: text("hero_subtitle"),
    heroCta: text("hero_cta"),
    footerText: text("footer_text"),
    showHeaderName: boolean("show_header_name").default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("tenants_custom_domain_idx").on(table.customDomain)]
);

export const usersTable = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    name: text("name").notNull(),
    avatar: text("avatar"),
    role: userRoleEnum("role").notNull().default("student"),
    tenantId: uuid("tenant_id").references(() => tenantsTable.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("users_tenant_id_idx").on(table.tenantId),
    index("users_role_idx").on(table.role),
  ]
);

export const refreshTokensTable = pgTable("refresh_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: text("token").notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const lessonsTable = pgTable(
  "lessons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    type: lessonTypeEnum("type").notNull().default("video"),
    videoKey: text("video_key"),
    duration: integer("duration").notNull().default(0),
    order: integer("order").notNull().default(0),
    isPreview: boolean("is_preview").notNull().default(false),
    status: lessonStatusEnum("status").notNull().default("draft"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("lessons_tenant_id_idx").on(table.tenantId),
    index("lessons_status_idx").on(table.status),
    index("lessons_type_idx").on(table.type),
  ]
);

export const modulesTable = pgTable(
  "modules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    status: moduleStatusEnum("status").notNull().default("draft"),
    order: integer("order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("modules_tenant_id_idx").on(table.tenantId),
    index("modules_status_idx").on(table.status),
  ]
);

export const moduleLessonsTable = pgTable(
  "module_lessons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    moduleId: uuid("module_id")
      .notNull()
      .references(() => modulesTable.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessonsTable.id, { onDelete: "cascade" }),
    order: integer("order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("module_lessons_module_id_idx").on(table.moduleId),
    index("module_lessons_lesson_id_idx").on(table.lessonId),
    index("module_lessons_order_idx").on(table.moduleId, table.order),
  ]
);

export const categoriesTable = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    order: integer("order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("categories_tenant_id_idx").on(table.tenantId),
    index("categories_slug_tenant_idx").on(table.slug, table.tenantId),
  ]
);

export const instructorsTable = pgTable(
  "instructors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    avatar: text("avatar"),
    bio: text("bio"),
    title: text("title"),
    email: text("email"),
    website: text("website"),
    socialLinks: jsonb("social_links").$type<{
      twitter?: string;
      linkedin?: string;
      github?: string;
    }>(),
    order: integer("order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("instructors_tenant_id_idx").on(table.tenantId)]
);

export const coursesTable = pgTable(
  "courses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    instructorId: uuid("instructor_id").references(() => instructorsTable.id, {
      onDelete: "set null",
    }),
    categoryId: uuid("category_id").references(() => categoriesTable.id, {
      onDelete: "set null",
    }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    shortDescription: text("short_description"),
    thumbnail: text("thumbnail"),
    previewVideoUrl: text("preview_video_url"),
    price: integer("price").notNull().default(0),
    originalPrice: integer("original_price"),
    currency: text("currency").notNull().default("USD"),
    level: courseLevelEnum("level").notNull().default("beginner"),
    tags: text("tags").array(),
    language: text("language").default("es"),
    status: courseStatusEnum("status").notNull().default("draft"),
    order: integer("order").notNull().default(0),
    features: text("features").array(),
    requirements: text("requirements").array(),
    objectives: text("objectives").array(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("courses_tenant_id_idx").on(table.tenantId),
    index("courses_instructor_id_idx").on(table.instructorId),
    index("courses_category_id_idx").on(table.categoryId),
    index("courses_status_idx").on(table.status),
    index("courses_slug_tenant_idx").on(table.slug, table.tenantId),
  ]
);

export const courseModulesTable = pgTable(
  "course_modules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => coursesTable.id, { onDelete: "cascade" }),
    moduleId: uuid("module_id")
      .notNull()
      .references(() => modulesTable.id, { onDelete: "cascade" }),
    order: integer("order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("course_modules_course_id_idx").on(table.courseId),
    index("course_modules_module_id_idx").on(table.moduleId),
    index("course_modules_order_idx").on(table.courseId, table.order),
  ]
);

// Type exports
export type InsertTenant = typeof tenantsTable.$inferInsert;
export type SelectTenant = typeof tenantsTable.$inferSelect;

export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;
export type UserRole = (typeof userRoleEnum.enumValues)[number];

export type InsertRefreshToken = typeof refreshTokensTable.$inferInsert;
export type SelectRefreshToken = typeof refreshTokensTable.$inferSelect;

export type InsertLesson = typeof lessonsTable.$inferInsert;
export type SelectLesson = typeof lessonsTable.$inferSelect;
export type LessonType = (typeof lessonTypeEnum.enumValues)[number];
export type LessonStatus = (typeof lessonStatusEnum.enumValues)[number];

export type InsertModule = typeof modulesTable.$inferInsert;
export type SelectModule = typeof modulesTable.$inferSelect;
export type ModuleStatus = (typeof moduleStatusEnum.enumValues)[number];

export type InsertModuleLesson = typeof moduleLessonsTable.$inferInsert;
export type SelectModuleLesson = typeof moduleLessonsTable.$inferSelect;

export type InsertCategory = typeof categoriesTable.$inferInsert;
export type SelectCategory = typeof categoriesTable.$inferSelect;

export type InsertInstructor = typeof instructorsTable.$inferInsert;
export type SelectInstructor = typeof instructorsTable.$inferSelect;

export type InsertCourse = typeof coursesTable.$inferInsert;
export type SelectCourse = typeof coursesTable.$inferSelect;
export type CourseLevel = (typeof courseLevelEnum.enumValues)[number];
export type CourseStatus = (typeof courseStatusEnum.enumValues)[number];

export type InsertCourseModule = typeof courseModulesTable.$inferInsert;
export type SelectCourseModule = typeof courseModulesTable.$inferSelect;
