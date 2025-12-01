import {
  boolean,
  index,
  integer,
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

export const tenantsTable = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

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
