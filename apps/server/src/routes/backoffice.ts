import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { AppError, ErrorCode } from "@/lib/errors";
import { withHandler } from "@/lib/handler";
import { db } from "@/db";
import {
  tenantsTable,
  usersTable,
  coursesTable,
  enrollmentsTable,
  certificatesTable,
  videosTable,
  documentsTable,
  waitlistTable,
} from "@/db/schema";
import { count, sql, eq, gte, and, desc, ilike } from "drizzle-orm";
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
import { getPresignedUrl } from "@/lib/upload";
import { s3 } from "@/lib/s3";

const enrollmentFieldMap: FieldMap<typeof enrollmentsTable> = {
  id: enrollmentsTable.id,
  status: enrollmentsTable.status,
  progress: enrollmentsTable.progress,
  createdAt: enrollmentsTable.createdAt,
  updatedAt: enrollmentsTable.updatedAt,
  completedAt: enrollmentsTable.completedAt,
};

const enrollmentDateFields: DateFields = new Set(["createdAt", "completedAt"]);

const certificateFieldMap: FieldMap<typeof certificatesTable> = {
  id: certificatesTable.id,
  verificationCode: certificatesTable.verificationCode,
  userName: certificatesTable.userName,
  courseName: certificatesTable.courseName,
  issuedAt: certificatesTable.issuedAt,
  createdAt: certificatesTable.createdAt,
};

const certificateSearchableFields: SearchableFields<typeof certificatesTable> = [
  certificatesTable.userName,
  certificatesTable.courseName,
  certificatesTable.verificationCode,
];

const certificateDateFields: DateFields = new Set(["issuedAt", "createdAt"]);

const waitlistFieldMap: FieldMap<typeof waitlistTable> = {
  id: waitlistTable.id,
  email: waitlistTable.email,
  createdAt: waitlistTable.createdAt,
};

const waitlistSearchableFields: SearchableFields<typeof waitlistTable> = [
  waitlistTable.email,
];

const waitlistDateFields: DateFields = new Set(["createdAt"]);

function requireSuperadmin(ctx: { user: unknown; userRole: string | null }) {
  if (!ctx.user) {
    throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
  }
  if (ctx.userRole !== "superadmin") {
    throw new AppError(
      ErrorCode.SUPERADMIN_REQUIRED,
      "Only superadmins can access backoffice stats",
      403
    );
  }
}

export const backofficeRoutes = new Elysia()
  .use(authPlugin)
  .get(
    "/stats",
    (ctx) =>
      withHandler(ctx, async () => {
        requireSuperadmin(ctx);

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

        const [
          usersResult,
          tenantsResult,
          coursesResult,
          enrollmentsResult,
          certificatesResult,
          activeUsersResult,
          usersLast30d,
          usersPrev30d,
          tenantsLast30d,
          tenantsPrev30d,
          enrollmentsLast30d,
          enrollmentsPrev30d,
          completedEnrollmentsResult,
          revenueResult,
          avgProgressResult,
        ] = await Promise.all([
          db.select({ count: count() }).from(usersTable),
          db.select({ count: count() }).from(tenantsTable),
          db.select({ count: count() }).from(coursesTable),
          db.select({ count: count() }).from(enrollmentsTable),
          db.select({ count: count() }).from(certificatesTable),
          db
            .select({ count: count() })
            .from(usersTable)
            .where(gte(usersTable.updatedAt, thirtyDaysAgo)),
          db
            .select({ count: count() })
            .from(usersTable)
            .where(gte(usersTable.createdAt, thirtyDaysAgo)),
          db
            .select({ count: count() })
            .from(usersTable)
            .where(
              and(
                gte(usersTable.createdAt, sixtyDaysAgo),
                sql`${usersTable.createdAt} < ${thirtyDaysAgo}`
              )
            ),
          db
            .select({ count: count() })
            .from(tenantsTable)
            .where(gte(tenantsTable.createdAt, thirtyDaysAgo)),
          db
            .select({ count: count() })
            .from(tenantsTable)
            .where(
              and(
                gte(tenantsTable.createdAt, sixtyDaysAgo),
                sql`${tenantsTable.createdAt} < ${thirtyDaysAgo}`
              )
            ),
          db
            .select({ count: count() })
            .from(enrollmentsTable)
            .where(gte(enrollmentsTable.createdAt, thirtyDaysAgo)),
          db
            .select({ count: count() })
            .from(enrollmentsTable)
            .where(
              and(
                gte(enrollmentsTable.createdAt, sixtyDaysAgo),
                sql`${enrollmentsTable.createdAt} < ${thirtyDaysAgo}`
              )
            ),
          db
            .select({ count: count() })
            .from(enrollmentsTable)
            .where(eq(enrollmentsTable.status, "completed")),
          db
            .select({
              total: sql<number>`COALESCE(SUM(${coursesTable.price}), 0)`,
              avgPrice: sql<number>`COALESCE(AVG(${coursesTable.price}), 0)`,
            })
            .from(enrollmentsTable)
            .innerJoin(coursesTable, eq(enrollmentsTable.courseId, coursesTable.id)),
          db
            .select({
              avgProgress: sql<number>`COALESCE(AVG(${enrollmentsTable.progress}), 0)`,
            })
            .from(enrollmentsTable)
            .where(eq(enrollmentsTable.status, "active")),
        ]);

        const calculateGrowth = (current: number, previous: number): number => {
          if (previous === 0) return current > 0 ? 100 : 0;
          return Math.round(((current - previous) / previous) * 100);
        };

        const totalEnrollments = enrollmentsResult[0].count;
        const completedEnrollments = completedEnrollmentsResult[0].count;
        const activeEnrollments = totalEnrollments - completedEnrollments;

        return {
          stats: {
            overview: {
              totalUsers: usersResult[0].count,
              totalTenants: tenantsResult[0].count,
              totalCourses: coursesResult[0].count,
              totalEnrollments,
              totalCertificates: certificatesResult[0].count,
              activeUsers30d: activeUsersResult[0].count,
            },
            growth: {
              usersChange: calculateGrowth(
                usersLast30d[0].count,
                usersPrev30d[0].count
              ),
              tenantsChange: calculateGrowth(
                tenantsLast30d[0].count,
                tenantsPrev30d[0].count
              ),
              enrollmentsChange: calculateGrowth(
                enrollmentsLast30d[0].count,
                enrollmentsPrev30d[0].count
              ),
            },
            revenue: {
              total: Number(revenueResult[0].total) / 100,
              avgCoursePrice: Math.round(Number(revenueResult[0].avgPrice) / 100),
            },
            engagement: {
              avgCompletionRate: Math.round(Number(avgProgressResult[0].avgProgress)),
              activeEnrollments,
              completedEnrollments,
            },
          },
        };
      }),
    {
      detail: {
        tags: ["Backoffice"],
        summary: "Get comprehensive backoffice dashboard stats (superadmin only)",
      },
    }
  )
  .get(
    "/stats/trends",
    (ctx) =>
      withHandler(ctx, async () => {
        requireSuperadmin(ctx);

        const period = (ctx.query.period as string) || "30d";
        const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const [userGrowth, enrollmentGrowth, certificatesIssued] =
          await Promise.all([
            db
              .select({
                date: sql<string>`DATE(${usersTable.createdAt})`.as("date"),
                count: count(),
              })
              .from(usersTable)
              .where(gte(usersTable.createdAt, startDate))
              .groupBy(sql`DATE(${usersTable.createdAt})`)
              .orderBy(sql`DATE(${usersTable.createdAt})`),
            db
              .select({
                date: sql<string>`DATE(${enrollmentsTable.createdAt})`.as("date"),
                count: count(),
              })
              .from(enrollmentsTable)
              .where(gte(enrollmentsTable.createdAt, startDate))
              .groupBy(sql`DATE(${enrollmentsTable.createdAt})`)
              .orderBy(sql`DATE(${enrollmentsTable.createdAt})`),
            db
              .select({
                date: sql<string>`DATE(${certificatesTable.issuedAt})`.as("date"),
                count: count(),
              })
              .from(certificatesTable)
              .where(gte(certificatesTable.issuedAt, startDate))
              .groupBy(sql`DATE(${certificatesTable.issuedAt})`)
              .orderBy(sql`DATE(${certificatesTable.issuedAt})`),
          ]);

        return {
          trends: {
            userGrowth: userGrowth.map((r) => ({
              date: r.date,
              count: r.count,
            })),
            enrollmentGrowth: enrollmentGrowth.map((r) => ({
              date: r.date,
              count: r.count,
            })),
            certificatesIssued: certificatesIssued.map((r) => ({
              date: r.date,
              count: r.count,
            })),
            period,
          },
        };
      }),
    {
      query: t.Object({
        period: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Backoffice"],
        summary: "Get time-series trends data (superadmin only)",
      },
    }
  )
  .get(
    "/stats/top-courses",
    (ctx) =>
      withHandler(ctx, async () => {
        requireSuperadmin(ctx);

        const limit = Number(ctx.query.limit) || 5;

        const topCourses = await db
          .select({
            id: coursesTable.id,
            title: coursesTable.title,
            tenantId: coursesTable.tenantId,
            tenantName: tenantsTable.name,
            price: coursesTable.price,
            enrollments: sql<number>`COUNT(${enrollmentsTable.id})::int`,
            completedCount: sql<number>`COUNT(CASE WHEN ${enrollmentsTable.status} = 'completed' THEN 1 END)::int`,
            revenue: sql<number>`(COUNT(${enrollmentsTable.id}) * ${coursesTable.price})::int`,
          })
          .from(coursesTable)
          .leftJoin(enrollmentsTable, eq(coursesTable.id, enrollmentsTable.courseId))
          .leftJoin(tenantsTable, eq(coursesTable.tenantId, tenantsTable.id))
          .groupBy(coursesTable.id, tenantsTable.name)
          .orderBy(desc(sql`COUNT(${enrollmentsTable.id})`))
          .limit(limit);

        return {
          courses: topCourses.map((course) => ({
            id: course.id,
            title: course.title,
            tenantName: course.tenantName,
            enrollments: course.enrollments,
            completionRate:
              course.enrollments > 0
                ? Math.round((course.completedCount / course.enrollments) * 100)
                : 0,
            revenue: course.revenue / 100,
          })),
        };
      }),
    {
      query: t.Object({
        limit: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Backoffice"],
        summary: "Get top performing courses (superadmin only)",
      },
    }
  )
  .get(
    "/stats/top-tenants",
    (ctx) =>
      withHandler(ctx, async () => {
        requireSuperadmin(ctx);

        const limit = Number(ctx.query.limit) || 5;

        const topTenants = await db
          .select({
            id: tenantsTable.id,
            name: tenantsTable.name,
            slug: tenantsTable.slug,
            usersCount: sql<number>`(
              SELECT COUNT(*) FROM ${usersTable}
              WHERE ${usersTable.tenantId} = ${tenantsTable.id}
            )::int`,
            coursesCount: sql<number>`(
              SELECT COUNT(*) FROM ${coursesTable}
              WHERE ${coursesTable.tenantId} = ${tenantsTable.id}
            )::int`,
            enrollmentsCount: sql<number>`(
              SELECT COUNT(*) FROM ${enrollmentsTable}
              WHERE ${enrollmentsTable.tenantId} = ${tenantsTable.id}
            )::int`,
          })
          .from(tenantsTable)
          .orderBy(
            desc(
              sql`(
                SELECT COUNT(*) FROM ${enrollmentsTable}
                WHERE ${enrollmentsTable.tenantId} = ${tenantsTable.id}
              )`
            )
          )
          .limit(limit);

        return {
          tenants: topTenants.map((tenant) => ({
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            usersCount: tenant.usersCount,
            coursesCount: tenant.coursesCount,
            enrollmentsCount: tenant.enrollmentsCount,
          })),
        };
      }),
    {
      query: t.Object({
        limit: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Backoffice"],
        summary: "Get top performing tenants (superadmin only)",
      },
    }
  )
  .get(
    "/enrollments",
    (ctx) =>
      withHandler(ctx, async () => {
        requireSuperadmin(ctx);

        const params = parseListParams(ctx.query);
        const baseWhereClause = buildWhereClause(
          params,
          enrollmentFieldMap,
          [],
          enrollmentDateFields
        );

        const tenantFilter = ctx.query.tenantId
          ? ilike(tenantsTable.name, `%${ctx.query.tenantId}%`)
          : undefined;

        const statusFilter = ctx.query.status
          ? eq(enrollmentsTable.status, ctx.query.status as "active" | "completed" | "cancelled")
          : undefined;

        const filters = [baseWhereClause, tenantFilter, statusFilter].filter(
          Boolean
        );
        const whereClause = filters.length > 0 ? and(...filters) : undefined;

        const sortColumn = getSortColumn(params.sort, enrollmentFieldMap, {
          field: "createdAt",
          order: "desc",
        });
        const { limit, offset } = getPaginationParams(params.page, params.limit);

        const baseQuery = db
          .select({
            id: enrollmentsTable.id,
            userId: enrollmentsTable.userId,
            userName: usersTable.name,
            userEmail: usersTable.email,
            courseId: enrollmentsTable.courseId,
            courseTitle: coursesTable.title,
            tenantId: enrollmentsTable.tenantId,
            tenantName: tenantsTable.name,
            tenantSlug: tenantsTable.slug,
            status: enrollmentsTable.status,
            progress: enrollmentsTable.progress,
            completedAt: enrollmentsTable.completedAt,
            createdAt: enrollmentsTable.createdAt,
            updatedAt: enrollmentsTable.updatedAt,
          })
          .from(enrollmentsTable)
          .leftJoin(usersTable, eq(enrollmentsTable.userId, usersTable.id))
          .leftJoin(coursesTable, eq(enrollmentsTable.courseId, coursesTable.id))
          .leftJoin(tenantsTable, eq(enrollmentsTable.tenantId, tenantsTable.id));

        let query = baseQuery.$dynamic();
        if (whereClause) {
          query = query.where(whereClause);
        }
        if (sortColumn) {
          query = query.orderBy(sortColumn);
        }
        query = query.limit(limit).offset(offset);

        const countQuery = db
          .select({ count: count() })
          .from(enrollmentsTable)
          .leftJoin(tenantsTable, eq(enrollmentsTable.tenantId, tenantsTable.id));

        let countQueryDynamic = countQuery.$dynamic();
        if (whereClause) {
          countQueryDynamic = countQueryDynamic.where(whereClause);
        }

        const [enrollments, [{ count: total }]] = await Promise.all([
          query,
          countQueryDynamic,
        ]);

        return {
          enrollments: enrollments.map((enrollment) => ({
            ...enrollment,
            user: enrollment.userId
              ? {
                  id: enrollment.userId,
                  name: enrollment.userName,
                  email: enrollment.userEmail,
                }
              : null,
            course: enrollment.courseId
              ? {
                  id: enrollment.courseId,
                  title: enrollment.courseTitle,
                }
              : null,
            tenant: enrollment.tenantId
              ? {
                  id: enrollment.tenantId,
                  name: enrollment.tenantName,
                  slug: enrollment.tenantSlug,
                }
              : null,
          })),
          pagination: calculatePagination(total, params.page, params.limit),
        };
      }),
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        sort: t.Optional(t.String()),
        search: t.Optional(t.String()),
        tenantId: t.Optional(t.String()),
        status: t.Optional(t.String()),
        createdAt: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Backoffice"],
        summary: "List all enrollments across tenants (superadmin only)",
      },
    }
  )
  .get(
    "/certificates",
    (ctx) =>
      withHandler(ctx, async () => {
        requireSuperadmin(ctx);

        const params = parseListParams(ctx.query);
        const baseWhereClause = buildWhereClause(
          params,
          certificateFieldMap,
          certificateSearchableFields,
          certificateDateFields
        );

        const tenantFilter = ctx.query.tenantId
          ? ilike(tenantsTable.name, `%${ctx.query.tenantId}%`)
          : undefined;

        const filters = [baseWhereClause, tenantFilter].filter(Boolean);
        const whereClause = filters.length > 0 ? and(...filters) : undefined;

        const sortColumn = getSortColumn(params.sort, certificateFieldMap, {
          field: "issuedAt",
          order: "desc",
        });
        const { limit, offset } = getPaginationParams(params.page, params.limit);

        const baseQuery = db
          .select({
            id: certificatesTable.id,
            verificationCode: certificatesTable.verificationCode,
            imageKey: certificatesTable.imageKey,
            userName: certificatesTable.userName,
            courseName: certificatesTable.courseName,
            userId: certificatesTable.userId,
            courseId: certificatesTable.courseId,
            tenantId: certificatesTable.tenantId,
            tenantName: tenantsTable.name,
            tenantSlug: tenantsTable.slug,
            issuedAt: certificatesTable.issuedAt,
            createdAt: certificatesTable.createdAt,
          })
          .from(certificatesTable)
          .leftJoin(tenantsTable, eq(certificatesTable.tenantId, tenantsTable.id));

        let query = baseQuery.$dynamic();
        if (whereClause) {
          query = query.where(whereClause);
        }
        if (sortColumn) {
          query = query.orderBy(sortColumn);
        }
        query = query.limit(limit).offset(offset);

        const countQuery = db
          .select({ count: count() })
          .from(certificatesTable)
          .leftJoin(tenantsTable, eq(certificatesTable.tenantId, tenantsTable.id));

        let countQueryDynamic = countQuery.$dynamic();
        if (whereClause) {
          countQueryDynamic = countQueryDynamic.where(whereClause);
        }

        const [certificates, [{ count: total }]] = await Promise.all([
          query,
          countQueryDynamic,
        ]);

        const certificatesWithUrls = await Promise.all(
          certificates.map(async (cert) => ({
            ...cert,
            imageUrl: cert.imageKey ? await getPresignedUrl(cert.imageKey) : null,
            tenant: cert.tenantId
              ? {
                  id: cert.tenantId,
                  name: cert.tenantName,
                  slug: cert.tenantSlug,
                }
              : null,
          }))
        );

        return {
          certificates: certificatesWithUrls,
          pagination: calculatePagination(total, params.page, params.limit),
        };
      }),
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        sort: t.Optional(t.String()),
        search: t.Optional(t.String()),
        tenantId: t.Optional(t.String()),
        issuedAt: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Backoffice"],
        summary: "List all certificates across tenants (superadmin only)",
      },
    }
  )
  .get(
    "/files",
    (ctx) =>
      withHandler(ctx, async () => {
        requireSuperadmin(ctx);

        const tenantId = ctx.query.tenantId;
        if (!tenantId) {
          throw new AppError(ErrorCode.BAD_REQUEST, "tenantId is required", 400);
        }

        const types = ctx.query.type?.split(",").filter(Boolean) || [];
        const includeAll = types.length === 0;

        const [videos, documents, users, tenantData, certificates] =
          await Promise.all([
            includeAll || types.includes("video")
              ? db
                  .select({
                    id: videosTable.id,
                    key: videosTable.videoKey,
                    title: videosTable.title,
                    createdAt: videosTable.createdAt,
                  })
                  .from(videosTable)
                  .where(
                    and(
                      eq(videosTable.tenantId, tenantId),
                      sql`${videosTable.videoKey} IS NOT NULL`
                    )
                  )
              : Promise.resolve([]),
            includeAll || types.includes("document")
              ? db
                  .select({
                    id: documentsTable.id,
                    key: documentsTable.fileKey,
                    title: documentsTable.title,
                    fileName: documentsTable.fileName,
                    fileSize: documentsTable.fileSize,
                    createdAt: documentsTable.createdAt,
                  })
                  .from(documentsTable)
                  .where(
                    and(
                      eq(documentsTable.tenantId, tenantId),
                      sql`${documentsTable.fileKey} IS NOT NULL`
                    )
                  )
              : Promise.resolve([]),
            includeAll || types.includes("avatar")
              ? db
                  .select({
                    id: usersTable.id,
                    key: usersTable.avatar,
                    name: usersTable.name,
                    createdAt: usersTable.createdAt,
                  })
                  .from(usersTable)
                  .where(
                    and(
                      eq(usersTable.tenantId, tenantId),
                      sql`${usersTable.avatar} IS NOT NULL`
                    )
                  )
              : Promise.resolve([]),
            includeAll || types.includes("logo") || types.includes("favicon")
              ? db
                  .select({
                    id: tenantsTable.id,
                    logo: tenantsTable.logo,
                    favicon: tenantsTable.favicon,
                    createdAt: tenantsTable.createdAt,
                  })
                  .from(tenantsTable)
                  .where(eq(tenantsTable.id, tenantId))
                  .limit(1)
              : Promise.resolve([]),
            includeAll || types.includes("certificate")
              ? db
                  .select({
                    id: certificatesTable.id,
                    key: certificatesTable.imageKey,
                    userName: certificatesTable.userName,
                    courseName: certificatesTable.courseName,
                    createdAt: certificatesTable.createdAt,
                  })
                  .from(certificatesTable)
                  .where(
                    and(
                      eq(certificatesTable.tenantId, tenantId),
                      sql`${certificatesTable.imageKey} IS NOT NULL`
                    )
                  )
              : Promise.resolve([]),
          ]);

        type FileResult = {
          key: string;
          type: string;
          size: number | null;
          url: string;
          createdAt: Date;
          metadata: Record<string, unknown>;
        };

        const results: FileResult[] = [];

        for (const video of videos) {
          if (video.key) {
            results.push({
              key: video.key,
              type: "video",
              size: null,
              url: await getPresignedUrl(video.key),
              createdAt: video.createdAt,
              metadata: { id: video.id, title: video.title },
            });
          }
        }

        for (const doc of documents) {
          if (doc.key) {
            results.push({
              key: doc.key,
              type: "document",
              size: doc.fileSize,
              url: await getPresignedUrl(doc.key),
              createdAt: doc.createdAt,
              metadata: { id: doc.id, title: doc.title, fileName: doc.fileName },
            });
          }
        }

        for (const user of users) {
          if (user.key) {
            results.push({
              key: user.key,
              type: "avatar",
              size: null,
              url: await getPresignedUrl(user.key),
              createdAt: user.createdAt,
              metadata: { id: user.id, userName: user.name },
            });
          }
        }

        if (tenantData.length > 0) {
          const tenant = tenantData[0];
          if (tenant.logo) {
            results.push({
              key: tenant.logo,
              type: "logo",
              size: null,
              url: await getPresignedUrl(tenant.logo),
              createdAt: tenant.createdAt,
              metadata: { id: tenant.id },
            });
          }
          if (tenant.favicon) {
            results.push({
              key: tenant.favicon,
              type: "favicon",
              size: null,
              url: await getPresignedUrl(tenant.favicon),
              createdAt: tenant.createdAt,
              metadata: { id: tenant.id },
            });
          }
        }

        for (const cert of certificates) {
          if (cert.key) {
            results.push({
              key: cert.key,
              type: "certificate",
              size: null,
              url: await getPresignedUrl(cert.key),
              createdAt: cert.createdAt,
              metadata: {
                id: cert.id,
                userName: cert.userName,
                courseName: cert.courseName,
              },
            });
          }
        }

        const summary = {
          totalFiles: results.length,
          byType: {
            videos: videos.filter((v) => v.key).length,
            documents: documents.filter((d) => d.key).length,
            avatars: users.filter((u) => u.key).length,
            logos: tenantData.filter((t) => t.logo).length,
            favicons: tenantData.filter((t) => t.favicon).length,
            certificates: certificates.filter((c) => c.key).length,
          },
          estimatedStorageBytes: documents.reduce(
            (acc, d) => acc + (d.fileSize || 0),
            0
          ),
        };

        return { files: results, summary };
      }),
    {
      query: t.Object({
        tenantId: t.String(),
        type: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Backoffice"],
        summary: "List all S3 files for a tenant (superadmin only)",
      },
    }
  )
  .post(
    "/files/upload",
    (ctx) =>
      withHandler(ctx, async () => {
        requireSuperadmin(ctx);

        const { base64, key } = ctx.body;

        const matches = base64.match(/^data:(.+);base64,(.+)$/);
        if (!matches) {
          throw new AppError(
            ErrorCode.BAD_REQUEST,
            "Invalid base64 data URL format",
            400
          );
        }

        const mimeType = matches[1];
        const buffer = Buffer.from(matches[2], "base64");

        await s3.write(key, buffer, { type: mimeType });

        const url = getPresignedUrl(key);

        return { key, url };
      }),
    {
      body: t.Object({
        base64: t.String({ minLength: 1 }),
        key: t.String({ minLength: 1 }),
      }),
      detail: {
        tags: ["Backoffice"],
        summary: "Upload file to S3 with custom key (superadmin only)",
      },
    }
  )
  .get(
    "/tenants",
    (ctx) =>
      withHandler(ctx, async () => {
        requireSuperadmin(ctx);

        const tenants = await db
          .select({
            id: tenantsTable.id,
            slug: tenantsTable.slug,
            name: tenantsTable.name,
            status: tenantsTable.status,
            maxUsers: tenantsTable.maxUsers,
            maxCourses: tenantsTable.maxCourses,
            maxStorageBytes: tenantsTable.maxStorageBytes,
            features: tenantsTable.features,
            createdAt: tenantsTable.createdAt,
            usersCount: sql<number>`(
              SELECT COUNT(*) FROM ${usersTable}
              WHERE ${usersTable.tenantId} = ${tenantsTable.id}
            )::int`,
            coursesCount: sql<number>`(
              SELECT COUNT(*) FROM ${coursesTable}
              WHERE ${coursesTable.tenantId} = ${tenantsTable.id}
            )::int`,
          })
          .from(tenantsTable)
          .orderBy(desc(tenantsTable.createdAt));

        return { tenants };
      }),
    {
      detail: {
        tags: ["Backoffice"],
        summary: "List all tenants with stats (superadmin only)",
      },
    }
  )
  .put(
    "/tenants/:id",
    (ctx) =>
      withHandler(ctx, async () => {
        requireSuperadmin(ctx);

        const [existingTenant] = await db
          .select()
          .from(tenantsTable)
          .where(eq(tenantsTable.id, ctx.params.id))
          .limit(1);

        if (!existingTenant) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "Tenant not found", 404);
        }

        const updateData: Partial<typeof tenantsTable.$inferInsert> = {};

        if (ctx.body.maxUsers !== undefined) {
          updateData.maxUsers = ctx.body.maxUsers;
        }
        if (ctx.body.maxCourses !== undefined) {
          updateData.maxCourses = ctx.body.maxCourses;
        }
        if (ctx.body.maxStorageBytes !== undefined) {
          updateData.maxStorageBytes = ctx.body.maxStorageBytes;
        }
        if (ctx.body.features !== undefined) {
          updateData.features = ctx.body.features;
        }
        if (ctx.body.status !== undefined) {
          updateData.status = ctx.body.status;
        }

        const [updatedTenant] = await db
          .update(tenantsTable)
          .set(updateData)
          .where(eq(tenantsTable.id, ctx.params.id))
          .returning();

        return { tenant: updatedTenant };
      }),
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        maxUsers: t.Optional(t.Nullable(t.Integer())),
        maxCourses: t.Optional(t.Nullable(t.Integer())),
        maxStorageBytes: t.Optional(t.Nullable(t.String())),
        features: t.Optional(
          t.Nullable(
            t.Object({
              analytics: t.Optional(t.Boolean()),
              certificates: t.Optional(t.Boolean()),
              customDomain: t.Optional(t.Boolean()),
              aiAnalysis: t.Optional(t.Boolean()),
              whiteLabel: t.Optional(t.Boolean()),
            })
          )
        ),
        status: t.Optional(
          t.Union([
            t.Literal("active"),
            t.Literal("suspended"),
            t.Literal("cancelled"),
          ])
        ),
      }),
      detail: {
        tags: ["Backoffice"],
        summary: "Update tenant limits and settings (superadmin only)",
      },
    }
  )
  .get(
    "/waitlist",
    (ctx) =>
      withHandler(ctx, async () => {
        requireSuperadmin(ctx);

        const params = parseListParams(ctx.query);
        const whereClause = buildWhereClause(
          params,
          waitlistFieldMap,
          waitlistSearchableFields,
          waitlistDateFields
        );

        const sortColumn = getSortColumn(params.sort, waitlistFieldMap, {
          field: "createdAt",
          order: "desc",
        });
        const { limit, offset } = getPaginationParams(params.page, params.limit);

        const baseQuery = db
          .select({
            id: waitlistTable.id,
            email: waitlistTable.email,
            createdAt: waitlistTable.createdAt,
          })
          .from(waitlistTable);

        let query = baseQuery.$dynamic();
        if (whereClause) {
          query = query.where(whereClause);
        }
        if (sortColumn) {
          query = query.orderBy(sortColumn);
        }
        query = query.limit(limit).offset(offset);

        const countQuery = db.select({ count: count() }).from(waitlistTable);

        let countQueryDynamic = countQuery.$dynamic();
        if (whereClause) {
          countQueryDynamic = countQueryDynamic.where(whereClause);
        }

        const [waitlist, [{ count: total }]] = await Promise.all([
          query,
          countQueryDynamic,
        ]);

        return {
          waitlist,
          pagination: calculatePagination(total, params.page, params.limit),
        };
      }),
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        sort: t.Optional(t.String()),
        search: t.Optional(t.String()),
        createdAt: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Backoffice"],
        summary: "List all waitlist entries (superadmin only)",
      },
    }
  );
