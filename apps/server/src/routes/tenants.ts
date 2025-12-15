import { Elysia, t } from "elysia";
import { authPlugin, invalidateUserCache, type UserWithoutPassword } from "@/plugins/auth";
import { invalidateTenantCache, invalidateCustomDomainCache } from "@/plugins/tenant";
import { AppError, ErrorCode } from "@/lib/errors";
import { db } from "@/db";
import {
  tenantsTable,
  usersTable,
  coursesTable,
  categoriesTable,
  instructorsTable,
  modulesTable,
  enrollmentsTable,
  certificatesTable,
} from "@/db/schema";
import { count, eq, sql, and, ne, gte, desc } from "drizzle-orm";
import { uploadBase64ToS3, getPresignedUrl, deleteFromS3 } from "@/lib/upload";
import {
  createCustomHostname,
  deleteCustomHostname,
  getCustomHostnameById,
  getCnameTarget,
} from "@/lib/cloudflare";
import {
  createRailwayCustomDomain,
  deleteRailwayCustomDomain,
} from "@/lib/railway";

const RESERVED_SLUGS = ["www", "api", "admin", "app", "backoffice", "dashboard", "news"];
import {
  parseListParams,
  buildWhereClause,
  getSortColumn,
  getPaginationParams,
  calculatePagination,
  type FieldMap,
  type SearchableFields,
  type DateFields,
} from "@/lib/filters";

const tenantFieldMap: FieldMap<typeof tenantsTable> = {
  id: tenantsTable.id,
  name: tenantsTable.name,
  slug: tenantsTable.slug,
  createdAt: tenantsTable.createdAt,
  updatedAt: tenantsTable.updatedAt,
};

const tenantSearchableFields: SearchableFields<typeof tenantsTable> = [
  tenantsTable.name,
  tenantsTable.slug,
];

const tenantDateFields: DateFields = new Set(["createdAt"]);

function transformTenant(tenant: typeof tenantsTable.$inferSelect) {
  return {
    ...tenant,
    logo: tenant.logo ? getPresignedUrl(tenant.logo) : null,
    favicon: tenant.favicon ? getPresignedUrl(tenant.favicon) : null,
    certificateSettings: tenant.certificateSettings
      ? {
          ...tenant.certificateSettings,
          signatureImageUrl: tenant.certificateSettings.signatureImageKey
            ? getPresignedUrl(tenant.certificateSettings.signatureImageKey)
            : null,
        }
      : null,
  };
}

function checkCanCreateTenant(user: UserWithoutPassword | null, userRole: string | null) {
  if (!user) {
    throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
  }
  if (userRole === "superadmin") {
    return;
  }
  if (userRole === "owner") {
    if (user.tenantId !== null) {
      throw new AppError(
        ErrorCode.OWNER_ALREADY_HAS_TENANT,
        "You already have a tenant",
        400
      );
    }
    return;
  }
  throw new AppError(
    ErrorCode.FORBIDDEN,
    "Only superadmins and owners can create tenants",
    403
  );
}

export const tenantsRoutes = new Elysia()
  .use(authPlugin)
  .post(
    "/",
    async (ctx) => {
        checkCanCreateTenant(ctx.user, ctx.userRole);

        if (RESERVED_SLUGS.includes(ctx.body.slug)) {
          throw new AppError(ErrorCode.BAD_REQUEST, "This slug is reserved", 400);
        }

        const result = await db.transaction(async (tx) => {
          const [tenant] = await tx
            .insert(tenantsTable)
            .values({
              slug: ctx.body.slug,
              name: ctx.body.name,
            })
            .onConflictDoNothing({ target: tenantsTable.slug })
            .returning();

          if (!tenant) {
            throw new AppError(
              ErrorCode.TENANT_SLUG_EXISTS,
              "Tenant slug already exists",
              409
            );
          }

          // If owner, link them to this tenant (in same transaction)
          if (ctx.userRole === "owner" && ctx.user) {
            await tx
              .update(usersTable)
              .set({ tenantId: tenant.id })
              .where(eq(usersTable.id, ctx.user.id));
          }

          return { tenant };
        });

        if (ctx.userRole === "owner" && ctx.user) {
          invalidateUserCache(ctx.user.id);
        }

        return result;
    },
    {
      body: t.Object({
        slug: t.String({ minLength: 1, pattern: "^[a-z0-9-]+$" }),
        name: t.String({ minLength: 1 }),
      }),
      detail: {
        tags: ["Tenants"],
        summary: "Create a new tenant (superadmin or owner)",
      },
    }
  )
  .get(
    "/",
    async (ctx) => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        // Owner sees only their tenant (no pagination)
        if (ctx.userRole === "owner") {
          if (!ctx.user.tenantId) {
            return { tenants: [], pagination: null };
          }
          const tenants = await db
            .select()
            .from(tenantsTable)
            .where(eq(tenantsTable.id, ctx.user.tenantId));
          return { tenants, pagination: null };
        }

        // Superadmin sees all tenants with pagination
        if (ctx.userRole !== "superadmin") {
          throw new AppError(ErrorCode.FORBIDDEN, "Access denied", 403);
        }

        const params = parseListParams(ctx.query);
        const whereClause = buildWhereClause(
          params,
          tenantFieldMap,
          tenantSearchableFields,
          tenantDateFields
        );

        const usersCountSubquery = db
          .select({
            tenantId: usersTable.tenantId,
            usersCount: count(usersTable.id).as("users_count"),
          })
          .from(usersTable)
          .groupBy(usersTable.tenantId)
          .as("users_count_sq");

        const baseQuery = db
          .select({
            id: tenantsTable.id,
            slug: tenantsTable.slug,
            name: tenantsTable.name,
            status: tenantsTable.status,
            createdAt: tenantsTable.createdAt,
            updatedAt: tenantsTable.updatedAt,
            usersCount: sql<number>`COALESCE(${usersCountSubquery.usersCount}, 0)`.as(
              "users_count"
            ),
          })
          .from(tenantsTable)
          .leftJoin(
            usersCountSubquery,
            eq(tenantsTable.id, usersCountSubquery.tenantId)
          );

        const sortColumn = getSortColumn(params.sort, tenantFieldMap, {
          field: "createdAt",
          order: "desc",
        });
        const { limit, offset } = getPaginationParams(params.page, params.limit);

        let query = baseQuery.$dynamic();
        if (whereClause) {
          query = query.where(whereClause);
        }
        if (sortColumn) {
          query = query.orderBy(sortColumn);
        }
        query = query.limit(limit).offset(offset);

        const countQuery = db.select({ count: count() }).from(tenantsTable);
        const countWithWhere = whereClause
          ? countQuery.where(whereClause)
          : countQuery;

        const [tenants, [{ count: total }]] = await Promise.all([
          query,
          countWithWhere,
        ]);

        return {
          tenants,
          pagination: calculatePagination(total, params.page, params.limit),
        };
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        sort: t.Optional(t.String()),
        search: t.Optional(t.String()),
        createdAt: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Tenants"],
        summary: "List tenants (superadmin: paginated, owner: their tenant)",
      },
    }
  )
  .get(
    "/by-slug/:slug",
    async (ctx) => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        const [tenant] = await db
          .select()
          .from(tenantsTable)
          .where(eq(tenantsTable.slug, ctx.params.slug))
          .limit(1);

        if (!tenant) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "Tenant not found", 404);
        }

        if (ctx.userRole === "superadmin") {
          return { tenant: transformTenant(tenant) };
        }

        if (ctx.userRole === "owner" && ctx.user.tenantId === tenant.id) {
          return { tenant: transformTenant(tenant) };
        }

        throw new AppError(ErrorCode.FORBIDDEN, "Access denied", 403);
    },
    {
      params: t.Object({
        slug: t.String(),
      }),
      detail: {
        tags: ["Tenants"],
        summary: "Get tenant by slug (superadmin or owner)",
      },
    }
  )
  .get(
    "/:id/stats",
    async (ctx) => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        const isOwnerViewingOwnTenant =
          ctx.userRole === "owner" && ctx.user.tenantId === ctx.params.id;

        if (ctx.userRole !== "superadmin" && !isOwnerViewingOwnTenant) {
          throw new AppError(ErrorCode.FORBIDDEN, "Access denied", 403);
        }

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [
          coursesResult,
          studentsResult,
          enrollmentsResult,
          certificatesResult,
          studentsChangeResult,
          enrollmentsChangeResult,
        ] = await Promise.all([
          db
            .select({ count: count() })
            .from(coursesTable)
            .where(
              and(
                eq(coursesTable.tenantId, ctx.params.id),
                eq(coursesTable.status, "published")
              )
            ),
          db
            .select({ count: count() })
            .from(usersTable)
            .where(
              and(
                eq(usersTable.tenantId, ctx.params.id),
                eq(usersTable.role, "student")
              )
            ),
          db
            .select({
              total: count(),
              active: sql<number>`COUNT(CASE WHEN ${enrollmentsTable.status} = 'active' THEN 1 END)`,
              completed: sql<number>`COUNT(CASE WHEN ${enrollmentsTable.status} = 'completed' THEN 1 END)`,
            })
            .from(enrollmentsTable)
            .where(eq(enrollmentsTable.tenantId, ctx.params.id)),
          db
            .select({ count: count() })
            .from(certificatesTable)
            .where(eq(certificatesTable.tenantId, ctx.params.id)),
          db
            .select({ count: count() })
            .from(usersTable)
            .where(
              and(
                eq(usersTable.tenantId, ctx.params.id),
                eq(usersTable.role, "student"),
                gte(usersTable.createdAt, thirtyDaysAgo)
              )
            ),
          db
            .select({ count: count() })
            .from(enrollmentsTable)
            .where(
              and(
                eq(enrollmentsTable.tenantId, ctx.params.id),
                gte(enrollmentsTable.createdAt, thirtyDaysAgo)
              )
            ),
        ]);

        const totalEnrollments = enrollmentsResult[0].total;
        const completedEnrollments = Number(enrollmentsResult[0].completed);
        const completionRate = totalEnrollments > 0
          ? Math.round((completedEnrollments / totalEnrollments) * 100)
          : 0;

        return {
          stats: {
            totalCourses: coursesResult[0].count,
            totalStudents: studentsResult[0].count,
            totalEnrollments: totalEnrollments,
            activeEnrollments: Number(enrollmentsResult[0].active),
            completedEnrollments: completedEnrollments,
            completionRate: completionRate,
            totalCertificates: certificatesResult[0].count,
            newStudents30d: studentsChangeResult[0].count,
            newEnrollments30d: enrollmentsChangeResult[0].count,
          },
        };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Tenants"],
        summary: "Get tenant dashboard stats (owner or superadmin)",
      },
    }
  )
  .get(
    "/:id/onboarding",
    async (ctx) => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        const isOwnerViewingOwnTenant =
          ctx.userRole === "owner" && ctx.user.tenantId === ctx.params.id;

        if (ctx.userRole !== "superadmin" && !isOwnerViewingOwnTenant) {
          throw new AppError(ErrorCode.FORBIDDEN, "Access denied", 403);
        }

        const [tenant] = await db
          .select()
          .from(tenantsTable)
          .where(eq(tenantsTable.id, ctx.params.id))
          .limit(1);

        if (!tenant) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "Tenant not found", 404);
        }

        const [
          [categoryCount],
          [instructorCount],
          [moduleCount],
          [courseCount],
        ] = await Promise.all([
          db
            .select({ count: count() })
            .from(categoriesTable)
            .where(eq(categoriesTable.tenantId, ctx.params.id)),
          db
            .select({ count: count() })
            .from(instructorsTable)
            .where(eq(instructorsTable.tenantId, ctx.params.id)),
          db
            .select({ count: count() })
            .from(modulesTable)
            .where(eq(modulesTable.tenantId, ctx.params.id)),
          db
            .select({ count: count() })
            .from(coursesTable)
            .where(
              and(
                eq(coursesTable.tenantId, ctx.params.id),
                eq(coursesTable.status, "published")
              )
            ),
        ]);

        return {
          steps: {
            basicInfo: !!(tenant.logo && tenant.description),
            category: categoryCount.count > 0,
            instructor: instructorCount.count > 0,
            module: moduleCount.count > 0,
            course: courseCount.count > 0,
          },
        };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Tenants"],
        summary: "Get tenant onboarding status (owner or superadmin)",
      },
    }
  )
  .get(
    "/:id/stats/trends",
    async (ctx) => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        const isOwnerViewingOwnTenant =
          ctx.userRole === "owner" && ctx.user.tenantId === ctx.params.id;

        if (ctx.userRole !== "superadmin" && !isOwnerViewingOwnTenant) {
          throw new AppError(ErrorCode.FORBIDDEN, "Access denied", 403);
        }

        const period = ctx.query.period || "30d";
        const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const enrollmentTrends = await db
          .select({
            date: sql<string>`DATE(${enrollmentsTable.createdAt})`.as("date"),
            count: count().as("count"),
          })
          .from(enrollmentsTable)
          .where(
            and(
              eq(enrollmentsTable.tenantId, ctx.params.id),
              gte(enrollmentsTable.createdAt, startDate)
            )
          )
          .groupBy(sql`DATE(${enrollmentsTable.createdAt})`)
          .orderBy(sql`DATE(${enrollmentsTable.createdAt})`);

        const completionTrends = await db
          .select({
            date: sql<string>`DATE(${enrollmentsTable.completedAt})`.as("date"),
            count: count().as("count"),
          })
          .from(enrollmentsTable)
          .where(
            and(
              eq(enrollmentsTable.tenantId, ctx.params.id),
              eq(enrollmentsTable.status, "completed"),
              gte(enrollmentsTable.completedAt, startDate)
            )
          )
          .groupBy(sql`DATE(${enrollmentsTable.completedAt})`)
          .orderBy(sql`DATE(${enrollmentsTable.completedAt})`);

        return {
          trends: {
            enrollmentGrowth: enrollmentTrends,
            completionGrowth: completionTrends,
            period,
          },
        };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      query: t.Object({
        period: t.Optional(t.Union([
          t.Literal("7d"),
          t.Literal("30d"),
          t.Literal("90d"),
        ])),
      }),
      detail: {
        tags: ["Tenants"],
        summary: "Get tenant enrollment and completion trends",
      },
    }
  )
  .get(
    "/:id/stats/top-courses",
    async (ctx) => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        const isOwnerViewingOwnTenant =
          ctx.userRole === "owner" && ctx.user.tenantId === ctx.params.id;

        if (ctx.userRole !== "superadmin" && !isOwnerViewingOwnTenant) {
          throw new AppError(ErrorCode.FORBIDDEN, "Access denied", 403);
        }

        const limit = ctx.query.limit ? parseInt(ctx.query.limit) : 5;

        const courses = await db
          .select({
            id: coursesTable.id,
            title: coursesTable.title,
            enrollments: count(enrollmentsTable.id).as("enrollments"),
            completionRate: sql<number>`
              COALESCE(
                ROUND(
                  (COUNT(CASE WHEN ${enrollmentsTable.status} = 'completed' THEN 1 END)::numeric /
                   NULLIF(COUNT(${enrollmentsTable.id}), 0)::numeric) * 100
                ),
                0
              )
            `.as("completion_rate"),
          })
          .from(coursesTable)
          .leftJoin(
            enrollmentsTable,
            eq(coursesTable.id, enrollmentsTable.courseId)
          )
          .where(eq(coursesTable.tenantId, ctx.params.id))
          .groupBy(coursesTable.id)
          .orderBy(desc(sql`COUNT(${enrollmentsTable.id})`))
          .limit(limit);

        return { courses };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      query: t.Object({
        limit: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Tenants"],
        summary: "Get tenant top courses by enrollment",
      },
    }
  )
  .get(
    "/:id/stats/activity",
    async (ctx) => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        const isOwnerViewingOwnTenant =
          ctx.userRole === "owner" && ctx.user.tenantId === ctx.params.id;

        if (ctx.userRole !== "superadmin" && !isOwnerViewingOwnTenant) {
          throw new AppError(ErrorCode.FORBIDDEN, "Access denied", 403);
        }

        const limit = ctx.query.limit ? parseInt(ctx.query.limit) : 10;

        const recentEnrollments = await db
          .select({
            id: enrollmentsTable.id,
            type: sql<string>`'enrollment'`.as("type"),
            userId: usersTable.id,
            userName: usersTable.name,
            userAvatar: usersTable.avatar,
            courseId: coursesTable.id,
            courseName: coursesTable.title,
            createdAt: enrollmentsTable.createdAt,
          })
          .from(enrollmentsTable)
          .innerJoin(usersTable, eq(enrollmentsTable.userId, usersTable.id))
          .innerJoin(coursesTable, eq(enrollmentsTable.courseId, coursesTable.id))
          .where(eq(enrollmentsTable.tenantId, ctx.params.id))
          .orderBy(desc(enrollmentsTable.createdAt))
          .limit(limit);

        const recentCompletions = await db
          .select({
            id: enrollmentsTable.id,
            type: sql<string>`'completion'`.as("type"),
            userId: usersTable.id,
            userName: usersTable.name,
            userAvatar: usersTable.avatar,
            courseId: coursesTable.id,
            courseName: coursesTable.title,
            createdAt: enrollmentsTable.completedAt,
          })
          .from(enrollmentsTable)
          .innerJoin(usersTable, eq(enrollmentsTable.userId, usersTable.id))
          .innerJoin(coursesTable, eq(enrollmentsTable.courseId, coursesTable.id))
          .where(
            and(
              eq(enrollmentsTable.tenantId, ctx.params.id),
              eq(enrollmentsTable.status, "completed")
            )
          )
          .orderBy(desc(enrollmentsTable.completedAt))
          .limit(limit);

        const recentCertificates = await db
          .select({
            id: certificatesTable.id,
            type: sql<string>`'certificate'`.as("type"),
            userId: usersTable.id,
            userName: usersTable.name,
            userAvatar: usersTable.avatar,
            courseId: coursesTable.id,
            courseName: coursesTable.title,
            createdAt: certificatesTable.issuedAt,
          })
          .from(certificatesTable)
          .innerJoin(usersTable, eq(certificatesTable.userId, usersTable.id))
          .innerJoin(coursesTable, eq(certificatesTable.courseId, coursesTable.id))
          .where(eq(certificatesTable.tenantId, ctx.params.id))
          .orderBy(desc(certificatesTable.issuedAt))
          .limit(limit);

        const allActivities = [
          ...recentEnrollments.map((e) => ({
            ...e,
            userAvatar: e.userAvatar ? getPresignedUrl(e.userAvatar) : null,
          })),
          ...recentCompletions.map((c) => ({
            ...c,
            userAvatar: c.userAvatar ? getPresignedUrl(c.userAvatar) : null,
          })),
          ...recentCertificates.map((c) => ({
            ...c,
            userAvatar: c.userAvatar ? getPresignedUrl(c.userAvatar) : null,
          })),
        ]
          .sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          })
          .slice(0, limit);

        return { activities: allActivities };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      query: t.Object({
        limit: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Tenants"],
        summary: "Get tenant recent activity",
      },
    }
  )
  .put(
    "/:id",
    async (ctx) => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        const isOwnerUpdatingOwnTenant =
          ctx.userRole === "owner" && ctx.user.tenantId === ctx.params.id;

        if (ctx.userRole !== "superadmin" && !isOwnerUpdatingOwnTenant) {
          throw new AppError(ErrorCode.FORBIDDEN, "Access denied", 403);
        }

        const [existingTenant] = await db
          .select()
          .from(tenantsTable)
          .where(eq(tenantsTable.id, ctx.params.id))
          .limit(1);

        if (!existingTenant) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "Tenant not found", 404);
        }

        if (ctx.body.slug && ctx.body.slug !== existingTenant.slug) {
          if (RESERVED_SLUGS.includes(ctx.body.slug)) {
            throw new AppError(
              ErrorCode.BAD_REQUEST,
              "This slug is reserved",
              400
            );
          }

          const [existingSlug] = await db
            .select({ id: tenantsTable.id })
            .from(tenantsTable)
            .where(
              and(
                eq(tenantsTable.slug, ctx.body.slug),
                ne(tenantsTable.id, ctx.params.id)
              )
            )
            .limit(1);

          if (existingSlug) {
            throw new AppError(
              ErrorCode.TENANT_SLUG_EXISTS,
              "Slug already exists",
              409
            );
          }
        }

        const [updatedTenant] = await db
          .update(tenantsTable)
          .set({
            slug: ctx.body.slug ?? existingTenant.slug,
            name: ctx.body.name,
            status: ctx.body.status,
            theme: ctx.body.theme,
            mode: ctx.body.mode,
            description: ctx.body.description,
            contactEmail: ctx.body.contactEmail,
            contactPhone: ctx.body.contactPhone,
            contactAddress: ctx.body.contactAddress,
            socialLinks: ctx.body.socialLinks,
            seoTitle: ctx.body.seoTitle,
            seoDescription: ctx.body.seoDescription,
            seoKeywords: ctx.body.seoKeywords,
            heroTitle: ctx.body.heroTitle,
            heroSubtitle: ctx.body.heroSubtitle,
            heroCta: ctx.body.heroCta,
            footerText: ctx.body.footerText,
            heroPattern: ctx.body.heroPattern,
            coursesPagePattern: ctx.body.coursesPagePattern,
            showHeaderName: ctx.body.showHeaderName,
            customTheme: ctx.body.customTheme,
            certificateSettings: ctx.body.certificateSettings,
            aiAssistantSettings: ctx.body.aiAssistantSettings,
            maxUsers: ctx.body.maxUsers,
            maxCourses: ctx.body.maxCourses,
            maxStorageBytes: ctx.body.maxStorageBytes,
            features: ctx.body.features,
          })
          .where(eq(tenantsTable.id, ctx.params.id))
          .returning();

        invalidateTenantCache(existingTenant.slug);
        if (existingTenant.customDomain) {
          invalidateCustomDomainCache(existingTenant.customDomain);
        }
        if (ctx.body.slug && ctx.body.slug !== existingTenant.slug) {
          invalidateTenantCache(ctx.body.slug);
        }

        return { tenant: transformTenant(updatedTenant) };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        slug: t.Optional(t.String({ minLength: 1, pattern: "^[a-z0-9-]+$" })),
        name: t.String({ minLength: 1 }),
        theme: t.Optional(t.Nullable(t.Union([
          t.Literal("default"),
          t.Literal("slate"),
          t.Literal("rose"),
          t.Literal("emerald"),
          t.Literal("tangerine"),
          t.Literal("ocean"),
        ]))),
        mode: t.Optional(t.Nullable(t.Union([
          t.Literal("light"),
          t.Literal("dark"),
          t.Literal("auto"),
        ]))),
        description: t.Optional(t.Nullable(t.String())),
        contactEmail: t.Optional(t.Nullable(t.String())),
        contactPhone: t.Optional(t.Nullable(t.String())),
        contactAddress: t.Optional(t.Nullable(t.String())),
        socialLinks: t.Optional(
          t.Nullable(
            t.Object({
              twitter: t.Optional(t.String()),
              facebook: t.Optional(t.String()),
              instagram: t.Optional(t.String()),
              linkedin: t.Optional(t.String()),
              youtube: t.Optional(t.String()),
            })
          )
        ),
        seoTitle: t.Optional(t.Nullable(t.String())),
        seoDescription: t.Optional(t.Nullable(t.String())),
        seoKeywords: t.Optional(t.Nullable(t.String())),
        heroTitle: t.Optional(t.Nullable(t.String())),
        heroSubtitle: t.Optional(t.Nullable(t.String())),
        heroCta: t.Optional(t.Nullable(t.String())),
        footerText: t.Optional(t.Nullable(t.String())),
        heroPattern: t.Optional(t.Nullable(t.Union([
          t.Literal("none"),
          t.Literal("grid"),
          t.Literal("dots"),
          t.Literal("waves"),
        ]))),
        coursesPagePattern: t.Optional(t.Nullable(t.Union([
          t.Literal("none"),
          t.Literal("grid"),
          t.Literal("dots"),
          t.Literal("waves"),
        ]))),
        showHeaderName: t.Optional(t.Boolean()),
        customTheme: t.Optional(t.Nullable(t.Object({
          background: t.Optional(t.String()),
          foreground: t.Optional(t.String()),
          card: t.Optional(t.String()),
          cardForeground: t.Optional(t.String()),
          popover: t.Optional(t.String()),
          popoverForeground: t.Optional(t.String()),
          primary: t.Optional(t.String()),
          primaryForeground: t.Optional(t.String()),
          secondary: t.Optional(t.String()),
          secondaryForeground: t.Optional(t.String()),
          muted: t.Optional(t.String()),
          mutedForeground: t.Optional(t.String()),
          accent: t.Optional(t.String()),
          accentForeground: t.Optional(t.String()),
          destructive: t.Optional(t.String()),
          destructiveForeground: t.Optional(t.String()),
          border: t.Optional(t.String()),
          input: t.Optional(t.String()),
          ring: t.Optional(t.String()),
          chart1: t.Optional(t.String()),
          chart2: t.Optional(t.String()),
          chart3: t.Optional(t.String()),
          chart4: t.Optional(t.String()),
          chart5: t.Optional(t.String()),
          sidebar: t.Optional(t.String()),
          sidebarForeground: t.Optional(t.String()),
          sidebarPrimary: t.Optional(t.String()),
          sidebarPrimaryForeground: t.Optional(t.String()),
          sidebarAccent: t.Optional(t.String()),
          sidebarAccentForeground: t.Optional(t.String()),
          sidebarBorder: t.Optional(t.String()),
          sidebarRing: t.Optional(t.String()),
          shadow: t.Optional(t.String()),
          shadowLg: t.Optional(t.String()),
          radius: t.Optional(t.String()),
          backgroundDark: t.Optional(t.String()),
          foregroundDark: t.Optional(t.String()),
          cardDark: t.Optional(t.String()),
          cardForegroundDark: t.Optional(t.String()),
          popoverDark: t.Optional(t.String()),
          popoverForegroundDark: t.Optional(t.String()),
          primaryDark: t.Optional(t.String()),
          primaryForegroundDark: t.Optional(t.String()),
          secondaryDark: t.Optional(t.String()),
          secondaryForegroundDark: t.Optional(t.String()),
          mutedDark: t.Optional(t.String()),
          mutedForegroundDark: t.Optional(t.String()),
          accentDark: t.Optional(t.String()),
          accentForegroundDark: t.Optional(t.String()),
          destructiveDark: t.Optional(t.String()),
          destructiveForegroundDark: t.Optional(t.String()),
          borderDark: t.Optional(t.String()),
          inputDark: t.Optional(t.String()),
          ringDark: t.Optional(t.String()),
          chart1Dark: t.Optional(t.String()),
          chart2Dark: t.Optional(t.String()),
          chart3Dark: t.Optional(t.String()),
          chart4Dark: t.Optional(t.String()),
          chart5Dark: t.Optional(t.String()),
          sidebarDark: t.Optional(t.String()),
          sidebarForegroundDark: t.Optional(t.String()),
          sidebarPrimaryDark: t.Optional(t.String()),
          sidebarPrimaryForegroundDark: t.Optional(t.String()),
          sidebarAccentDark: t.Optional(t.String()),
          sidebarAccentForegroundDark: t.Optional(t.String()),
          sidebarBorderDark: t.Optional(t.String()),
          sidebarRingDark: t.Optional(t.String()),
          shadowDark: t.Optional(t.String()),
          shadowLgDark: t.Optional(t.String()),
          fontHeading: t.Optional(t.String()),
          fontBody: t.Optional(t.String()),
        }))),
        certificateSettings: t.Optional(t.Nullable(t.Object({
          signatureImageKey: t.Optional(t.String()),
          signatureTitle: t.Optional(t.String()),
          customMessage: t.Optional(t.String()),
        }))),
        aiAssistantSettings: t.Optional(t.Nullable(t.Object({
          enabled: t.Optional(t.Boolean()),
          name: t.Optional(t.String({ maxLength: 50 })),
          customPrompt: t.Optional(t.String({ maxLength: 2000 })),
          preferredLanguage: t.Optional(t.Union([
            t.Literal("auto"),
            t.Literal("en"),
            t.Literal("es"),
            t.Literal("pt"),
          ])),
          tone: t.Optional(t.Union([
            t.Literal("professional"),
            t.Literal("friendly"),
            t.Literal("casual"),
            t.Literal("academic"),
          ])),
        }))),
        status: t.Optional(t.Union([
          t.Literal("active"),
          t.Literal("suspended"),
          t.Literal("cancelled"),
        ])),
        maxUsers: t.Optional(t.Nullable(t.Number())),
        maxCourses: t.Optional(t.Nullable(t.Number())),
        maxStorageBytes: t.Optional(t.Nullable(t.String())),
        features: t.Optional(t.Nullable(t.Object({
          analytics: t.Optional(t.Boolean()),
          certificates: t.Optional(t.Boolean()),
          customDomain: t.Optional(t.Boolean()),
          aiAnalysis: t.Optional(t.Boolean()),
          whiteLabel: t.Optional(t.Boolean()),
        }))),
      }),
      detail: {
        tags: ["Tenants"],
        summary: "Update tenant (superadmin or owner)",
      },
    }
  )
  .delete(
    "/:id",
    async (ctx) => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (ctx.userRole !== "superadmin") {
          throw new AppError(
            ErrorCode.SUPERADMIN_REQUIRED,
            "Only superadmins can delete tenants",
            403
          );
        }

        const [existingTenant] = await db
          .select()
          .from(tenantsTable)
          .where(eq(tenantsTable.id, ctx.params.id))
          .limit(1);

        if (!existingTenant) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "Tenant not found", 404);
        }

        await db.delete(tenantsTable).where(eq(tenantsTable.id, ctx.params.id));

        invalidateTenantCache(existingTenant.slug);

        return { success: true };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Tenants"],
        summary: "Delete tenant (superadmin only)",
      },
    }
  )
  .post(
    "/:id/logo",
    async (ctx) => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        const isOwnerUpdatingOwnTenant =
          ctx.userRole === "owner" && ctx.user.tenantId === ctx.params.id;

        if (ctx.userRole !== "superadmin" && !isOwnerUpdatingOwnTenant) {
          throw new AppError(ErrorCode.FORBIDDEN, "Access denied", 403);
        }

        const [existingTenant] = await db
          .select()
          .from(tenantsTable)
          .where(eq(tenantsTable.id, ctx.params.id))
          .limit(1);

        if (!existingTenant) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "Tenant not found", 404);
        }

        if (!ctx.body.logo.startsWith("data:image/")) {
          throw new AppError(ErrorCode.BAD_REQUEST, "Logo must be an image", 400);
        }

        const [, logoKey, faviconKey] = await Promise.all([
          existingTenant.logo
            ? deleteFromS3(existingTenant.logo)
            : Promise.resolve(),
          uploadBase64ToS3({
            base64: ctx.body.logo,
            folder: "logos",
            userId: ctx.params.id,
          }),
          uploadBase64ToS3({
            base64: ctx.body.logo,
            folder: "favicons",
            userId: ctx.params.id,
          }),
        ]);

        if (existingTenant.favicon) {
          await deleteFromS3(existingTenant.favicon);
        }

        const [updatedTenant] = await db
          .update(tenantsTable)
          .set({ logo: logoKey, favicon: faviconKey })
          .where(eq(tenantsTable.id, ctx.params.id))
          .returning();

        invalidateTenantCache(existingTenant.slug);

        return {
          logoKey,
          logoUrl: getPresignedUrl(logoKey),
          tenant: transformTenant(updatedTenant),
        };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        logo: t.String(),
      }),
      detail: {
        tags: ["Tenants"],
        summary: "Upload tenant logo",
      },
    }
  )
  .delete(
    "/:id/logo",
    async (ctx) => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        const isOwnerUpdatingOwnTenant =
          ctx.userRole === "owner" && ctx.user.tenantId === ctx.params.id;

        if (ctx.userRole !== "superadmin" && !isOwnerUpdatingOwnTenant) {
          throw new AppError(ErrorCode.FORBIDDEN, "Access denied", 403);
        }

        const [existingTenant] = await db
          .select()
          .from(tenantsTable)
          .where(eq(tenantsTable.id, ctx.params.id))
          .limit(1);

        if (!existingTenant) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "Tenant not found", 404);
        }

        await Promise.all([
          existingTenant.logo ? deleteFromS3(existingTenant.logo) : Promise.resolve(),
          existingTenant.favicon ? deleteFromS3(existingTenant.favicon) : Promise.resolve(),
        ]);

        const [updatedTenant] = await db
          .update(tenantsTable)
          .set({ logo: null, favicon: null })
          .where(eq(tenantsTable.id, ctx.params.id))
          .returning();

        invalidateTenantCache(existingTenant.slug);

        return { tenant: transformTenant(updatedTenant) };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Tenants"],
        summary: "Delete tenant logo",
      },
    }
  )
  .post(
    "/:id/certificate-signature",
    async (ctx) => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        const isOwnerUpdatingOwnTenant =
          ctx.userRole === "owner" && ctx.user.tenantId === ctx.params.id;

        if (ctx.userRole !== "superadmin" && !isOwnerUpdatingOwnTenant) {
          throw new AppError(ErrorCode.FORBIDDEN, "Access denied", 403);
        }

        const [existingTenant] = await db
          .select()
          .from(tenantsTable)
          .where(eq(tenantsTable.id, ctx.params.id))
          .limit(1);

        if (!existingTenant) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "Tenant not found", 404);
        }

        if (!ctx.body.signature.startsWith("data:image/")) {
          throw new AppError(ErrorCode.BAD_REQUEST, "Signature must be an image", 400);
        }

        const oldKey = existingTenant.certificateSettings?.signatureImageKey;

        const [, signatureKey] = await Promise.all([
          oldKey ? deleteFromS3(oldKey) : Promise.resolve(),
          uploadBase64ToS3({
            base64: ctx.body.signature,
            folder: "signatures",
            userId: ctx.params.id,
          }),
        ]);

        const newSettings = {
          ...existingTenant.certificateSettings,
          signatureImageKey: signatureKey,
        };

        const [updatedTenant] = await db
          .update(tenantsTable)
          .set({ certificateSettings: newSettings })
          .where(eq(tenantsTable.id, ctx.params.id))
          .returning();

        invalidateTenantCache(existingTenant.slug);

        return {
          signatureKey,
          signatureUrl: getPresignedUrl(signatureKey),
          tenant: transformTenant(updatedTenant),
        };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        signature: t.String(),
      }),
      detail: {
        tags: ["Tenants"],
        summary: "Upload certificate signature image",
      },
    }
  )
  .delete(
    "/:id/certificate-signature",
    async (ctx) => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        const isOwnerUpdatingOwnTenant =
          ctx.userRole === "owner" && ctx.user.tenantId === ctx.params.id;

        if (ctx.userRole !== "superadmin" && !isOwnerUpdatingOwnTenant) {
          throw new AppError(ErrorCode.FORBIDDEN, "Access denied", 403);
        }

        const [existingTenant] = await db
          .select()
          .from(tenantsTable)
          .where(eq(tenantsTable.id, ctx.params.id))
          .limit(1);

        if (!existingTenant) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "Tenant not found", 404);
        }

        const oldKey = existingTenant.certificateSettings?.signatureImageKey;
        if (oldKey) {
          await deleteFromS3(oldKey);
        }

        const newSettings = existingTenant.certificateSettings
          ? { ...existingTenant.certificateSettings, signatureImageKey: undefined }
          : null;

        const [updatedTenant] = await db
          .update(tenantsTable)
          .set({ certificateSettings: newSettings })
          .where(eq(tenantsTable.id, ctx.params.id))
          .returning();

        invalidateTenantCache(existingTenant.slug);

        return { tenant: transformTenant(updatedTenant) };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Tenants"],
        summary: "Delete certificate signature image",
      },
    }
  )
  .put(
    "/:id/domain",
    async (ctx) => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        const isOwnerUpdatingOwnTenant =
          ctx.userRole === "owner" && ctx.user.tenantId === ctx.params.id;

        if (ctx.userRole !== "superadmin" && !isOwnerUpdatingOwnTenant) {
          throw new AppError(ErrorCode.FORBIDDEN, "Access denied", 403);
        }

        const [existingTenant] = await db
          .select()
          .from(tenantsTable)
          .where(eq(tenantsTable.id, ctx.params.id))
          .limit(1);

        if (!existingTenant) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "Tenant not found", 404);
        }

        const { customDomain } = ctx.body;

        if (customDomain) {
          const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;
          if (!domainRegex.test(customDomain)) {
            throw new AppError(ErrorCode.BAD_REQUEST, "Invalid domain format", 400);
          }

          const [existingDomain] = await db
            .select({ id: tenantsTable.id })
            .from(tenantsTable)
            .where(
              and(
                eq(tenantsTable.customDomain, customDomain.toLowerCase()),
                ne(tenantsTable.id, ctx.params.id)
              )
            )
            .limit(1);

          if (existingDomain) {
            throw new AppError(ErrorCode.BAD_REQUEST, "Domain already in use", 409);
          }
        }

        if (existingTenant.customDomain) {
          invalidateCustomDomainCache(existingTenant.customDomain);
        }

        if (existingTenant.customHostnameId && !customDomain) {
          await deleteCustomHostname(existingTenant.customHostnameId);
        }

        if (existingTenant.railwayDomainId && !customDomain) {
          await deleteRailwayCustomDomain(existingTenant.railwayDomainId);
        }

        let customHostnameId: string | null = existingTenant.customHostnameId;
        let railwayDomainId: string | null = existingTenant.railwayDomainId;

        if (customDomain && customDomain.toLowerCase() !== existingTenant.customDomain) {
          if (existingTenant.customHostnameId) {
            await deleteCustomHostname(existingTenant.customHostnameId);
          }
          if (existingTenant.railwayDomainId) {
            await deleteRailwayCustomDomain(existingTenant.railwayDomainId);
          }
          const cfHostname = await createCustomHostname(customDomain.toLowerCase());
          customHostnameId = cfHostname.id;

          const railwayDomain = await createRailwayCustomDomain(customDomain.toLowerCase());
          railwayDomainId = railwayDomain.id;
        }

        const [updatedTenant] = await db
          .update(tenantsTable)
          .set({
            customDomain: customDomain?.toLowerCase() || null,
            customHostnameId: customDomain ? customHostnameId : null,
            railwayDomainId: customDomain ? railwayDomainId : null,
          })
          .where(eq(tenantsTable.id, ctx.params.id))
          .returning();

        invalidateTenantCache(existingTenant.slug);

        return {
          tenant: transformTenant(updatedTenant),
          cnameTarget: getCnameTarget(),
        };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        customDomain: t.Nullable(t.String()),
      }),
      detail: {
        tags: ["Tenants"],
        summary: "Configure custom domain",
      },
    }
  )
  .get(
    "/:id/domain/verify",
    async (ctx) => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        const isOwnerUpdatingOwnTenant =
          ctx.userRole === "owner" && ctx.user.tenantId === ctx.params.id;

        if (ctx.userRole !== "superadmin" && !isOwnerUpdatingOwnTenant) {
          throw new AppError(ErrorCode.FORBIDDEN, "Access denied", 403);
        }

        const [tenant] = await db
          .select()
          .from(tenantsTable)
          .where(eq(tenantsTable.id, ctx.params.id))
          .limit(1);

        if (!tenant) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "Tenant not found", 404);
        }

        if (!tenant.customDomain || !tenant.customHostnameId) {
          throw new AppError(ErrorCode.BAD_REQUEST, "No custom domain configured", 400);
        }

        const cfHostname = await getCustomHostnameById(tenant.customHostnameId);
        const isActive = cfHostname.status === "active" && cfHostname.ssl.status === "active";

        return {
          verified: isActive,
          status: cfHostname.status,
          sslStatus: cfHostname.ssl.status,
          cnameTarget: getCnameTarget(),
        };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Tenants"],
        summary: "Verify custom domain DNS",
      },
    }
  )
  .delete(
    "/:id/domain",
    async (ctx) => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        const isOwnerUpdatingOwnTenant =
          ctx.userRole === "owner" && ctx.user.tenantId === ctx.params.id;

        if (ctx.userRole !== "superadmin" && !isOwnerUpdatingOwnTenant) {
          throw new AppError(ErrorCode.FORBIDDEN, "Access denied", 403);
        }

        const [existingTenant] = await db
          .select()
          .from(tenantsTable)
          .where(eq(tenantsTable.id, ctx.params.id))
          .limit(1);

        if (!existingTenant) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "Tenant not found", 404);
        }

        if (existingTenant.customDomain) {
          invalidateCustomDomainCache(existingTenant.customDomain);
        }

        if (existingTenant.customHostnameId) {
          await deleteCustomHostname(existingTenant.customHostnameId);
        }

        if (existingTenant.railwayDomainId) {
          await deleteRailwayCustomDomain(existingTenant.railwayDomainId);
        }

        const [updatedTenant] = await db
          .update(tenantsTable)
          .set({ customDomain: null, customHostnameId: null, railwayDomainId: null })
          .where(eq(tenantsTable.id, ctx.params.id))
          .returning();

        invalidateTenantCache(existingTenant.slug);

        return { tenant: transformTenant(updatedTenant) };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Tenants"],
        summary: "Remove custom domain",
      },
    }
  );
