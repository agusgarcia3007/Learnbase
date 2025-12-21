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
  "instructor",
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

export const tenantPlanEnum = pgEnum("tenant_plan", [
  "starter",
  "growth",
  "scale",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
]);

export const connectAccountStatusEnum = pgEnum("connect_account_status", [
  "not_started",
  "pending",
  "active",
  "restricted",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "processing",
  "succeeded",
  "failed",
  "refunded",
]);

export const aiToneEnum = pgEnum("ai_tone", [
  "formal",
  "casual",
  "professional",
  "academic",
  "friendly",
]);

export const aiFeedbackTypeEnum = pgEnum("ai_feedback_type", [
  "thumbs_up",
  "thumbs_down",
  "correction",
  "preference_stated",
]);

export const featureStatusEnum = pgEnum("feature_status", [
  "pending",
  "ideas",
  "in_progress",
  "shipped",
]);

export const featurePriorityEnum = pgEnum("feature_priority", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "feature_approved",
  "feature_rejected",
  "feature_shipped",
  "upcoming_features",
]);

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
    plan: tenantPlanEnum("plan"),
    stripeCustomerId: text("stripe_customer_id").unique(),
    stripeSubscriptionId: text("stripe_subscription_id").unique(),
    subscriptionStatus: subscriptionStatusEnum("subscription_status"),
    trialEndsAt: timestamp("trial_ends_at"),
    billingEmail: text("billing_email"),
    commissionRate: integer("commission_rate").notNull().default(5),
    stripeConnectAccountId: text("stripe_connect_account_id").unique(),
    stripeConnectStatus: connectAccountStatusEnum("stripe_connect_status").default("not_started"),
    chargesEnabled: boolean("charges_enabled").default(false),
    payoutsEnabled: boolean("payouts_enabled").default(false),
    published: boolean("published").default(true).notNull(),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("tenants_custom_domain_idx").on(table.customDomain),
    index("tenants_status_idx").on(table.status),
    index("tenants_stripe_customer_id_idx").on(table.stripeCustomerId),
    index("tenants_stripe_connect_account_id_idx").on(table.stripeConnectAccountId),
    index("tenants_plan_idx").on(table.plan),
    index("tenants_published_idx").on(table.published),
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

export const tenantCustomersTable = pgTable(
  "tenant_customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    stripeCustomerId: text("stripe_customer_id").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("tenant_customers_tenant_id_idx").on(table.tenantId),
    index("tenant_customers_user_id_idx").on(table.userId),
    uniqueIndex("tenant_customers_tenant_user_idx").on(table.tenantId, table.userId),
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
    fileSizeBytes: integer("file_size_bytes"),
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

export const instructorProfilesTable = pgTable(
  "instructor_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
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
  (table) => [
    index("instructor_profiles_tenant_id_idx").on(table.tenantId),
    index("instructor_profiles_user_id_idx").on(table.userId),
    uniqueIndex("instructor_profiles_tenant_user_idx").on(
      table.tenantId,
      table.userId
    ),
  ]
);

export const coursesTable = pgTable(
  "courses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    instructorId: uuid("instructor_id").references(
      () => instructorProfilesTable.id,
      { onDelete: "set null" }
    ),
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
    paymentId: uuid("payment_id"),
    purchasePrice: integer("purchase_price"),
    purchaseCurrency: text("purchase_currency"),
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
    index("enrollments_tenant_status_created_idx").on(
      table.tenantId,
      table.status,
      table.createdAt
    ),
    uniqueIndex("enrollments_user_course_idx").on(table.userId, table.courseId),
  ]
);

export const paymentsTable = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
    stripeCheckoutSessionId: text("stripe_checkout_session_id").unique(),
    amount: integer("amount").notNull(),
    platformFee: integer("platform_fee").notNull().default(0),
    currency: text("currency").notNull().default("usd"),
    status: paymentStatusEnum("status").notNull().default("pending"),
    metadata: jsonb("metadata").$type<{
      courseIds: string[];
      courseCount: number;
    }>(),
    errorMessage: text("error_message"),
    paidAt: timestamp("paid_at"),
    refundedAt: timestamp("refunded_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("payments_tenant_id_idx").on(table.tenantId),
    index("payments_user_id_idx").on(table.userId),
    index("payments_status_idx").on(table.status),
    index("payments_stripe_payment_intent_id_idx").on(table.stripePaymentIntentId),
    index("payments_stripe_checkout_session_id_idx").on(table.stripeCheckoutSessionId),
  ]
);

export const paymentItemsTable = pgTable(
  "payment_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    paymentId: uuid("payment_id")
      .notNull()
      .references(() => paymentsTable.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => coursesTable.id, { onDelete: "cascade" }),
    priceAtPurchase: integer("price_at_purchase").notNull(),
    currencyAtPurchase: text("currency_at_purchase").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("payment_items_payment_id_idx").on(table.paymentId),
    index("payment_items_course_id_idx").on(table.courseId),
  ]
);

export const subscriptionHistoryTable = pgTable(
  "subscription_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    stripeSubscriptionId: text("stripe_subscription_id").notNull(),
    stripeEventId: text("stripe_event_id").notNull().unique(),
    previousPlan: tenantPlanEnum("previous_plan"),
    newPlan: tenantPlanEnum("new_plan"),
    previousStatus: subscriptionStatusEnum("previous_status"),
    newStatus: subscriptionStatusEnum("new_status"),
    eventType: text("event_type").notNull(),
    eventData: jsonb("event_data"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("subscription_history_tenant_id_idx").on(table.tenantId),
    index("subscription_history_stripe_subscription_id_idx").on(table.stripeSubscriptionId),
    index("subscription_history_stripe_event_id_idx").on(table.stripeEventId),
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
    index("item_progress_enrollment_status_idx").on(
      table.enrollmentId,
      table.status
    ),
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

export type TitleStyle = {
  averageLength: number;
  capitalizationStyle: "title" | "sentence" | "lowercase";
  commonPrefixes: string[];
};

export type DescriptionStyle = {
  averageLength: number;
  formalityScore: number;
  usesEmoji: boolean;
};

export type ModulePatterns = {
  averageItemsPerModule: number;
  namingPattern: string;
  preferredContentOrder: ("video" | "document" | "quiz")[];
};

export type Vocabulary = {
  preferredTerms: Record<string, string>;
  domainTerms: string[];
  avoidTerms: string[];
};

export type ExplicitPreference = {
  rule: string;
  source: "user_stated" | "feedback_derived";
  confidence: number;
  createdAt: string;
};

export const tenantAiProfilesTable = pgTable(
  "tenant_ai_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .unique()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    inferredTone: aiToneEnum("inferred_tone"),
    titleStyle: jsonb("title_style").$type<TitleStyle>(),
    descriptionStyle: jsonb("description_style").$type<DescriptionStyle>(),
    modulePatterns: jsonb("module_patterns").$type<ModulePatterns>(),
    vocabulary: jsonb("vocabulary").$type<Vocabulary>(),
    explicitPreferences: jsonb("explicit_preferences").$type<{
      rules: ExplicitPreference[];
    }>(),
    coursesAnalyzed: integer("courses_analyzed").notNull().default(0),
    feedbackCount: integer("feedback_count").notNull().default(0),
    lastAnalyzedAt: timestamp("last_analyzed_at"),
    profileVersion: integer("profile_version").notNull().default(1),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("tenant_ai_profiles_tenant_id_idx").on(table.tenantId),
    index("tenant_ai_profiles_last_analyzed_idx").on(table.lastAnalyzedAt),
  ]
);

export const aiFeedbackTable = pgTable(
  "ai_feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    feedbackType: aiFeedbackTypeEnum("feedback_type").notNull(),
    sessionId: text("session_id"),
    traceId: text("trace_id"),
    messageIndex: integer("message_index"),
    originalContent: text("original_content"),
    correctedContent: text("corrected_content"),
    userInstruction: text("user_instruction"),
    extractedPreference: text("extracted_preference"),
    preferenceConfidence: integer("preference_confidence"),
    processedForProfile: boolean("processed_for_profile").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("ai_feedback_tenant_id_idx").on(table.tenantId),
    index("ai_feedback_user_id_idx").on(table.userId),
    index("ai_feedback_processed_idx").on(table.processedForProfile),
    index("ai_feedback_created_at_idx").on(table.createdAt),
  ]
);

export const jobStatusEnum = pgEnum("job_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const jobTypeEnum = pgEnum("job_type", [
  "send-welcome-email",
  "create-stripe-customer",
  "send-tenant-welcome-email",
  "create-connected-customer",
  "sync-connected-customer",
  "send-feature-submission-email",
  "send-feature-approved-email",
  "send-feature-rejected-email",
]);

export const jobsHistoryTable = pgTable(
  "jobs_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobType: jobTypeEnum("job_type").notNull(),
    jobData: jsonb("job_data").notNull(),
    status: jobStatusEnum("status").notNull().default("pending"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    index("jobs_history_status_idx").on(table.status),
    index("jobs_history_job_type_idx").on(table.jobType),
    index("jobs_history_created_at_idx").on(table.createdAt),
  ]
);

export const featuresTable = pgTable(
  "features",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    status: featureStatusEnum("status").notNull().default("pending"),
    priority: featurePriorityEnum("priority").notNull().default("medium"),
    order: integer("order").notNull().default(0),
    submittedById: uuid("submitted_by_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    approvedById: uuid("approved_by_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    rejectedById: uuid("rejected_by_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    rejectionReason: text("rejection_reason"),
    approvedAt: timestamp("approved_at"),
    rejectedAt: timestamp("rejected_at"),
    shippedAt: timestamp("shipped_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("features_status_idx").on(table.status),
    index("features_submitted_by_idx").on(table.submittedById),
    index("features_created_at_idx").on(table.createdAt),
    index("features_status_order_idx").on(table.status, table.order),
  ]
);

export const featureVotesTable = pgTable(
  "feature_votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    featureId: uuid("feature_id")
      .notNull()
      .references(() => featuresTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    value: integer("value").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("feature_votes_feature_id_idx").on(table.featureId),
    index("feature_votes_user_id_idx").on(table.userId),
    uniqueIndex("feature_votes_feature_user_idx").on(
      table.featureId,
      table.userId
    ),
  ]
);

export const featureAttachmentsTable = pgTable(
  "feature_attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    featureId: uuid("feature_id")
      .notNull()
      .references(() => featuresTable.id, { onDelete: "cascade" }),
    fileKey: text("file_key").notNull(),
    fileName: text("file_name").notNull(),
    fileSize: integer("file_size").notNull(),
    mimeType: text("mime_type").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("feature_attachments_feature_id_idx").on(table.featureId)]
);

export const userNotificationsTable = pgTable(
  "user_notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    metadata: jsonb("metadata").$type<{
      featureId?: string;
      featureTitle?: string;
      rejectionReason?: string;
    }>(),
    isRead: boolean("is_read").notNull().default(false),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("user_notifications_user_id_idx").on(table.userId),
    index("user_notifications_is_read_idx").on(table.userId, table.isRead),
    index("user_notifications_created_at_idx").on(table.createdAt),
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

export type InsertInstructorProfile = typeof instructorProfilesTable.$inferInsert;
export type SelectInstructorProfile = typeof instructorProfilesTable.$inferSelect;

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
export type TenantPlan = (typeof tenantPlanEnum.enumValues)[number];
export type SubscriptionStatus = (typeof subscriptionStatusEnum.enumValues)[number];
export type ConnectAccountStatus = (typeof connectAccountStatusEnum.enumValues)[number];
export type TenantFeatures = NonNullable<SelectTenant["features"]>;

export type InsertVideoSubtitle = typeof videoSubtitlesTable.$inferInsert;
export type SelectVideoSubtitle = typeof videoSubtitlesTable.$inferSelect;
export type SubtitleStatus = (typeof subtitleStatusEnum.enumValues)[number];

export type InsertPayment = typeof paymentsTable.$inferInsert;
export type SelectPayment = typeof paymentsTable.$inferSelect;
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];

export type InsertPaymentItem = typeof paymentItemsTable.$inferInsert;
export type SelectPaymentItem = typeof paymentItemsTable.$inferSelect;

export type InsertSubscriptionHistory = typeof subscriptionHistoryTable.$inferInsert;
export type SelectSubscriptionHistory = typeof subscriptionHistoryTable.$inferSelect;

export type InsertTenantAiProfile = typeof tenantAiProfilesTable.$inferInsert;
export type SelectTenantAiProfile = typeof tenantAiProfilesTable.$inferSelect;
export type AiTone = (typeof aiToneEnum.enumValues)[number];

export type InsertAiFeedback = typeof aiFeedbackTable.$inferInsert;
export type SelectAiFeedback = typeof aiFeedbackTable.$inferSelect;
export type AiFeedbackType = (typeof aiFeedbackTypeEnum.enumValues)[number];

export type InsertJobHistory = typeof jobsHistoryTable.$inferInsert;
export type SelectJobHistory = typeof jobsHistoryTable.$inferSelect;
export type JobStatus = (typeof jobStatusEnum.enumValues)[number];
export type JobType = (typeof jobTypeEnum.enumValues)[number];

export type InsertFeature = typeof featuresTable.$inferInsert;
export type SelectFeature = typeof featuresTable.$inferSelect;
export type FeatureStatus = (typeof featureStatusEnum.enumValues)[number];
export type FeaturePriority = (typeof featurePriorityEnum.enumValues)[number];

export type InsertFeatureVote = typeof featureVotesTable.$inferInsert;
export type SelectFeatureVote = typeof featureVotesTable.$inferSelect;

export type InsertFeatureAttachment = typeof featureAttachmentsTable.$inferInsert;
export type SelectFeatureAttachment = typeof featureAttachmentsTable.$inferSelect;

export type InsertUserNotification = typeof userNotificationsTable.$inferInsert;
export type SelectUserNotification = typeof userNotificationsTable.$inferSelect;
export type NotificationType = (typeof notificationTypeEnum.enumValues)[number];
