import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "superadmin",
  "owner",
  "admin",
  "student",
]);

export const questionTypeEnum = pgEnum("question_type", [
  "multiple_choice",
  "multiple_select",
  "true_false",
]);
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
export const tenantModeEnum = pgEnum("tenant_mode", ["light", "dark", "auto"]);
export const backgroundPatternEnum = pgEnum("background_pattern", [
  "none",
  "grid",
  "dots",
  "waves",
]);
export const contentTypeEnum = pgEnum("content_type", [
  "video",
  "document",
  "quiz",
]);
export const contentStatusEnum = pgEnum("content_status", [
  "draft",
  "published",
]);

export const enrollmentStatusEnum = pgEnum("enrollment_status", [
  "active",
  "completed",
  "cancelled",
]);

export const itemProgressStatusEnum = pgEnum("item_progress_status", [
  "not_started",
  "in_progress",
  "completed",
]);

export const subtitleLanguageEnum = pgEnum("subtitle_language", ["en", "es", "pt"]);

export const subtitleStatusEnum = pgEnum("subtitle_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const tenantStatusEnum = pgEnum("tenant_status", [
  "active",
  "suspended",
  "cancelled",
]);

// TODO: Agregar planes de tenant cuando se implemente facturación
// export const tenantPlanEnum = pgEnum("tenant_plan", [
//   "free",
//   "starter",
//   "pro",
//   "enterprise",
// ]);

export const tenantsTable = pgTable(
  "tenants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    logo: text("logo"),
    favicon: text("favicon"),
    theme: tenantThemeEnum("theme").default("default"),
    mode: tenantModeEnum("mode").default("auto"),
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
    heroPattern: backgroundPatternEnum("hero_pattern").default("grid"),
    coursesPagePattern: backgroundPatternEnum("courses_page_pattern").default("grid"),
    showHeaderName: boolean("show_header_name").default(true),
    customTheme: jsonb("custom_theme").$type<{
      background?: string;
      foreground?: string;
      card?: string;
      cardForeground?: string;
      popover?: string;
      popoverForeground?: string;
      primary?: string;
      primaryForeground?: string;
      secondary?: string;
      secondaryForeground?: string;
      muted?: string;
      mutedForeground?: string;
      accent?: string;
      accentForeground?: string;
      destructive?: string;
      destructiveForeground?: string;
      border?: string;
      input?: string;
      ring?: string;
      chart1?: string;
      chart2?: string;
      chart3?: string;
      chart4?: string;
      chart5?: string;
      sidebar?: string;
      sidebarForeground?: string;
      sidebarPrimary?: string;
      sidebarPrimaryForeground?: string;
      sidebarAccent?: string;
      sidebarAccentForeground?: string;
      sidebarBorder?: string;
      sidebarRing?: string;
      shadow?: string;
      shadowLg?: string;
      radius?: string;
      backgroundDark?: string;
      foregroundDark?: string;
      cardDark?: string;
      cardForegroundDark?: string;
      popoverDark?: string;
      popoverForegroundDark?: string;
      primaryDark?: string;
      primaryForegroundDark?: string;
      secondaryDark?: string;
      secondaryForegroundDark?: string;
      mutedDark?: string;
      mutedForegroundDark?: string;
      accentDark?: string;
      accentForegroundDark?: string;
      destructiveDark?: string;
      destructiveForegroundDark?: string;
      borderDark?: string;
      inputDark?: string;
      ringDark?: string;
      chart1Dark?: string;
      chart2Dark?: string;
      chart3Dark?: string;
      chart4Dark?: string;
      chart5Dark?: string;
      sidebarDark?: string;
      sidebarForegroundDark?: string;
      sidebarPrimaryDark?: string;
      sidebarPrimaryForegroundDark?: string;
      sidebarAccentDark?: string;
      sidebarAccentForegroundDark?: string;
      sidebarBorderDark?: string;
      sidebarRingDark?: string;
      shadowDark?: string;
      shadowLgDark?: string;
      fontHeading?: string;
      fontBody?: string;
    }>(),
    certificateSettings: jsonb("certificate_settings").$type<{
      signatureImageKey?: string;
      signatureTitle?: string;
      customMessage?: string;
    }>(),
    aiAssistantSettings: jsonb("ai_assistant_settings").$type<{
      enabled?: boolean;
      name?: string;
      customPrompt?: string;
      preferredLanguage?: "auto" | "en" | "es" | "pt";
      tone?: "professional" | "friendly" | "casual" | "academic";
    }>(),
    maxUsers: integer("max_users"),
    maxCourses: integer("max_courses"),
    maxStorageBytes: text("max_storage_bytes"),
    features: jsonb("features").$type<{
      analytics?: boolean;
      certificates?: boolean;
      customDomain?: boolean;
      aiAnalysis?: boolean;
      whiteLabel?: boolean;
    }>(),
    status: tenantStatusEnum("status").default("active").notNull(),
    // TODO: Agregar campos de facturación cuando se implemente
    // plan: tenantPlanEnum("plan").default("free").notNull(),
    // trialEndsAt: timestamp("trial_ends_at"),
    // billingEmail: text("billing_email"),
    // stripeCustomerId: text("stripe_customer_id"),
    // stripeSubscriptionId: text("stripe_subscription_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("tenants_custom_domain_idx").on(table.customDomain),
    index("tenants_status_idx").on(table.status),
  ]
);

export const usersTable = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    password: text("password").notNull(),
    name: text("name").notNull(),
    avatar: text("avatar"),
    locale: text("locale").notNull().default("en"),
    role: userRoleEnum("role").notNull().default("student"),
    tenantId: uuid("tenant_id").references(() => tenantsTable.id, {
      onDelete: "cascade",
    }),
    emailVerified: boolean("email_verified").notNull().default(false),
    emailVerificationToken: text("email_verification_token"),
    emailVerificationTokenExpiresAt: timestamp(
      "email_verification_token_expires_at"
    ),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("users_tenant_id_idx").on(table.tenantId),
    index("users_role_idx").on(table.role),
    index("users_email_verification_token_idx").on(table.emailVerificationToken),
    uniqueIndex("users_email_tenant_idx").on(table.email, table.tenantId),
    uniqueIndex("users_email_null_tenant_idx")
      .on(table.email)
      .where(sql`tenant_id IS NULL`),
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
    embedding: vector("embedding", { dimensions: 384 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("modules_tenant_id_idx").on(table.tenantId),
    index("modules_status_idx").on(table.status),
    index("modules_tenant_status_idx").on(table.tenantId, table.status),
    index("modules_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  ]
);

export const videosTable = pgTable(
  "videos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    videoKey: text("video_key"),
    duration: integer("duration").notNull().default(0),
    transcript: text("transcript"),
    status: contentStatusEnum("status").notNull().default("draft"),
    embedding: vector("embedding", { dimensions: 384 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("videos_tenant_id_idx").on(table.tenantId),
    index("videos_status_idx").on(table.status),
    index("videos_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  ]
);

export type SubtitleSegment = {
  start: number;
  end: number;
  text: string;
};

export const videoSubtitlesTable = pgTable(
  "video_subtitles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    videoId: uuid("video_id")
      .notNull()
      .references(() => videosTable.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    language: text("language").notNull(),
    isOriginal: boolean("is_original").notNull().default(false),
    vttKey: text("vtt_key"),
    segments: jsonb("segments").$type<SubtitleSegment[]>(),
    status: subtitleStatusEnum("status").notNull().default("pending"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("video_subtitles_video_id_idx").on(table.videoId),
    index("video_subtitles_tenant_id_idx").on(table.tenantId),
    index("video_subtitles_status_idx").on(table.status),
    uniqueIndex("video_subtitles_video_language_idx").on(
      table.videoId,
      table.language
    ),
  ]
);

export const documentsTable = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    fileKey: text("file_key"),
    fileName: text("file_name"),
    fileSize: integer("file_size"),
    mimeType: text("mime_type"),
    status: contentStatusEnum("status").notNull().default("draft"),
    embedding: vector("embedding", { dimensions: 384 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("documents_tenant_id_idx").on(table.tenantId),
    index("documents_status_idx").on(table.status),
    index("documents_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  ]
);

export const quizzesTable = pgTable(
  "quizzes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    status: contentStatusEnum("status").notNull().default("draft"),
    embedding: vector("embedding", { dimensions: 384 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("quizzes_tenant_id_idx").on(table.tenantId),
    index("quizzes_status_idx").on(table.status),
    index("quizzes_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  ]
);

export const moduleItemsTable = pgTable(
  "module_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    moduleId: uuid("module_id")
      .notNull()
      .references(() => modulesTable.id, { onDelete: "cascade" }),
    contentType: contentTypeEnum("content_type").notNull(),
    contentId: uuid("content_id").notNull(),
    order: integer("order").notNull().default(0),
    isPreview: boolean("is_preview").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("module_items_module_id_idx").on(table.moduleId),
    index("module_items_content_idx").on(table.contentType, table.contentId),
    index("module_items_order_idx").on(table.moduleId, table.order),
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
    includeCertificate: boolean("include_certificate").notNull().default(false),
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
    index("courses_tenant_created_idx").on(table.tenantId, table.createdAt),
    index("courses_tenant_status_idx").on(table.tenantId, table.status),
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

export const courseCategoriesTable = pgTable(
  "course_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => coursesTable.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categoriesTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("course_categories_course_id_idx").on(table.courseId),
    index("course_categories_category_id_idx").on(table.categoryId),
    uniqueIndex("course_categories_course_category_idx").on(
      table.courseId,
      table.categoryId
    ),
  ]
);

export const cartItemsTable = pgTable(
  "cart_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => coursesTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("cart_items_user_id_idx").on(table.userId),
    index("cart_items_tenant_id_idx").on(table.tenantId),
    uniqueIndex("cart_items_user_course_idx").on(table.userId, table.courseId),
  ]
);

export const quizQuestionsTable = pgTable(
  "quiz_questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quizId: uuid("quiz_id")
      .notNull()
      .references(() => quizzesTable.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    type: questionTypeEnum("type").notNull(),
    questionText: text("question_text").notNull(),
    explanation: text("explanation"),
    order: integer("order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("quiz_questions_quiz_id_idx").on(table.quizId),
    index("quiz_questions_tenant_id_idx").on(table.tenantId),
    index("quiz_questions_order_idx").on(table.quizId, table.order),
  ]
);

export const quizOptionsTable = pgTable(
  "quiz_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    questionId: uuid("question_id")
      .notNull()
      .references(() => quizQuestionsTable.id, { onDelete: "cascade" }),
    optionText: text("option_text").notNull(),
    isCorrect: boolean("is_correct").notNull().default(false),
    order: integer("order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("quiz_options_question_id_idx").on(table.questionId),
    index("quiz_options_order_idx").on(table.questionId, table.order),
  ]
);

export const enrollmentsTable = pgTable(
  "enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => coursesTable.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    status: enrollmentStatusEnum("status").notNull().default("active"),
    progress: integer("progress").notNull().default(0),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("enrollments_user_id_idx").on(table.userId),
    index("enrollments_course_id_idx").on(table.courseId),
    index("enrollments_tenant_id_idx").on(table.tenantId),
    index("enrollments_status_idx").on(table.status),
    index("enrollments_user_tenant_idx").on(table.userId, table.tenantId),
    index("enrollments_user_status_idx").on(table.userId, table.status),
    uniqueIndex("enrollments_user_course_idx").on(table.userId, table.courseId),
  ]
);

export const itemProgressTable = pgTable(
  "item_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => enrollmentsTable.id, { onDelete: "cascade" }),
    moduleItemId: uuid("module_item_id")
      .notNull()
      .references(() => moduleItemsTable.id, { onDelete: "cascade" }),
    status: itemProgressStatusEnum("status").notNull().default("not_started"),
    videoProgress: integer("video_progress").default(0),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("item_progress_enrollment_id_idx").on(table.enrollmentId),
    index("item_progress_module_item_id_idx").on(table.moduleItemId),
    index("item_progress_status_idx").on(table.status),
    uniqueIndex("item_progress_enrollment_item_idx").on(
      table.enrollmentId,
      table.moduleItemId
    ),
  ]
);

export const certificatesTable = pgTable(
  "certificates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => enrollmentsTable.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => coursesTable.id, { onDelete: "cascade" }),
    verificationCode: text("verification_code").notNull().unique(),
    imageKey: text("image_key"),
    userName: text("user_name").notNull(),
    courseName: text("course_name").notNull(),
    issuedAt: timestamp("issued_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    regenerationCount: integer("regeneration_count").notNull().default(0),
    lastRegeneratedAt: timestamp("last_regenerated_at"),
  },
  (table) => [
    index("certificates_enrollment_id_idx").on(table.enrollmentId),
    index("certificates_tenant_id_idx").on(table.tenantId),
    index("certificates_verification_code_idx").on(table.verificationCode),
    uniqueIndex("certificates_enrollment_unique_idx").on(table.enrollmentId),
  ]
);

export const waitlistTable = pgTable("waitlist", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pageViewsTable = pgTable(
  "page_views",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    sessionId: text("session_id").notNull(),
    path: text("path").notNull(),
    referrer: text("referrer"),
    userAgent: text("user_agent"),
    country: text("country"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("page_views_tenant_id_idx").on(table.tenantId),
    index("page_views_session_id_idx").on(table.sessionId),
    index("page_views_created_at_idx").on(table.createdAt),
    index("page_views_path_idx").on(table.path),
  ]
);

export const sessionsTable = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    lastActivityAt: timestamp("last_activity_at").notNull().defaultNow(),
    pageViews: integer("page_views").notNull().default(1),
    entryPath: text("entry_path").notNull(),
    exitPath: text("exit_path"),
    referrer: text("referrer"),
    userAgent: text("user_agent"),
    country: text("country"),
    isBounce: boolean("is_bounce").notNull().default(true),
  },
  (table) => [
    index("sessions_tenant_id_idx").on(table.tenantId),
    index("sessions_started_at_idx").on(table.startedAt),
    index("sessions_is_bounce_idx").on(table.isBounce),
  ]
);

// Type exports
export type InsertTenant = typeof tenantsTable.$inferInsert;
export type SelectTenant = typeof tenantsTable.$inferSelect;
export type CustomTheme = NonNullable<SelectTenant["customTheme"]>;

export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;
export type UserRole = (typeof userRoleEnum.enumValues)[number];

export type InsertRefreshToken = typeof refreshTokensTable.$inferInsert;
export type SelectRefreshToken = typeof refreshTokensTable.$inferSelect;

export type InsertModule = typeof modulesTable.$inferInsert;
export type SelectModule = typeof modulesTable.$inferSelect;
export type ModuleStatus = (typeof moduleStatusEnum.enumValues)[number];

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

export type InsertCartItem = typeof cartItemsTable.$inferInsert;
export type SelectCartItem = typeof cartItemsTable.$inferSelect;

export type InsertQuizQuestion = typeof quizQuestionsTable.$inferInsert;
export type SelectQuizQuestion = typeof quizQuestionsTable.$inferSelect;
export type QuestionType = (typeof questionTypeEnum.enumValues)[number];

export type InsertQuizOption = typeof quizOptionsTable.$inferInsert;
export type SelectQuizOption = typeof quizOptionsTable.$inferSelect;

export type InsertVideo = typeof videosTable.$inferInsert;
export type SelectVideo = typeof videosTable.$inferSelect;

export type InsertDocument = typeof documentsTable.$inferInsert;
export type SelectDocument = typeof documentsTable.$inferSelect;

export type InsertQuiz = typeof quizzesTable.$inferInsert;
export type SelectQuiz = typeof quizzesTable.$inferSelect;

export type InsertModuleItem = typeof moduleItemsTable.$inferInsert;
export type SelectModuleItem = typeof moduleItemsTable.$inferSelect;

export type ContentType = (typeof contentTypeEnum.enumValues)[number];
export type ContentStatus = (typeof contentStatusEnum.enumValues)[number];

export type InsertEnrollment = typeof enrollmentsTable.$inferInsert;
export type SelectEnrollment = typeof enrollmentsTable.$inferSelect;
export type EnrollmentStatus = (typeof enrollmentStatusEnum.enumValues)[number];

export type InsertItemProgress = typeof itemProgressTable.$inferInsert;
export type SelectItemProgress = typeof itemProgressTable.$inferSelect;
export type ItemProgressStatus =
  (typeof itemProgressStatusEnum.enumValues)[number];

export type InsertCertificate = typeof certificatesTable.$inferInsert;
export type SelectCertificate = typeof certificatesTable.$inferSelect;
export type CertificateSettings = NonNullable<
  SelectTenant["certificateSettings"]
>;

export type InsertWaitlist = typeof waitlistTable.$inferInsert;
export type SelectWaitlist = typeof waitlistTable.$inferSelect;

export type InsertPageView = typeof pageViewsTable.$inferInsert;
export type SelectPageView = typeof pageViewsTable.$inferSelect;

export type InsertSession = typeof sessionsTable.$inferInsert;
export type SelectSession = typeof sessionsTable.$inferSelect;

export type TenantStatus = (typeof tenantStatusEnum.enumValues)[number];
// TODO: Agregar TenantPlan cuando se implemente facturación
// export type TenantPlan = (typeof tenantPlanEnum.enumValues)[number];
export type TenantFeatures = NonNullable<SelectTenant["features"]>;

export type InsertVideoSubtitle = typeof videoSubtitlesTable.$inferInsert;
export type SelectVideoSubtitle = typeof videoSubtitlesTable.$inferSelect;
export type SubtitleStatus = (typeof subtitleStatusEnum.enumValues)[number];
