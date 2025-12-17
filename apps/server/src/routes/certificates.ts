import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { AppError, ErrorCode } from "@/lib/errors";
import { db } from "@/db";
import {
  certificatesTable,
  coursesTable,
  tenantsTable,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getPresignedUrl } from "@/lib/upload";
import { sendEmail } from "@/lib/utils";
import { getCertificateEmailHtml } from "@/lib/email-templates";
import { env } from "@/lib/env";
import {
  generateCertificatePreview,
  regenerateCertificate,
} from "@/lib/certificate";

function buildVerificationUrl(
  verificationCode: string,
  tenantSlug: string,
  customDomain: string | null
): string {
  const baseUrl = customDomain
    ? `https://${customDomain}`
    : `https://${tenantSlug}.${env.BASE_DOMAIN}`;
  return `${baseUrl}/verify/${verificationCode}`;
}

export const certificatesRoutes = new Elysia({ name: "certificates" })
  .use(authPlugin)
  .get(
    "/",
    async (ctx) => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }
        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const [tenant] = await db
          .select({
            slug: tenantsTable.slug,
            customDomain: tenantsTable.customDomain,
          })
          .from(tenantsTable)
          .where(eq(tenantsTable.id, ctx.user.tenantId))
          .limit(1);

        const certificates = await db
          .select({
            id: certificatesTable.id,
            verificationCode: certificatesTable.verificationCode,
            imageKey: certificatesTable.imageKey,
            userName: certificatesTable.userName,
            courseName: certificatesTable.courseName,
            issuedAt: certificatesTable.issuedAt,
            enrollmentId: certificatesTable.enrollmentId,
            course: {
              id: coursesTable.id,
              slug: coursesTable.slug,
              title: coursesTable.title,
              thumbnail: coursesTable.thumbnail,
            },
          })
          .from(certificatesTable)
          .innerJoin(coursesTable, eq(certificatesTable.courseId, coursesTable.id))
          .where(
            and(
              eq(certificatesTable.userId, ctx.user.id),
              eq(certificatesTable.tenantId, ctx.user.tenantId)
            )
          )
          .orderBy(desc(certificatesTable.issuedAt));

        return {
          certificates: certificates.map((cert) => ({
            id: cert.id,
            verificationCode: cert.verificationCode,
            imageUrl: cert.imageKey ? getPresignedUrl(cert.imageKey) : null,
            userName: cert.userName,
            courseName: cert.courseName,
            issuedAt: cert.issuedAt,
            enrollmentId: cert.enrollmentId,
            verificationUrl: tenant
              ? buildVerificationUrl(cert.verificationCode, tenant.slug, tenant.customDomain)
              : `${env.CLIENT_URL}/verify/${cert.verificationCode}`,
            course: {
              id: cert.course.id,
              slug: cert.course.slug,
              title: cert.course.title,
              thumbnail: cert.course.thumbnail
                ? getPresignedUrl(cert.course.thumbnail)
                : null,
            },
          })),
        };
      },
    {
      detail: { tags: ["Certificates"], summary: "List user certificates" },
    }
  )
  .get(
    "/:enrollmentId",
    async (ctx) => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }
        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const [tenant] = await db
          .select({
            slug: tenantsTable.slug,
            customDomain: tenantsTable.customDomain,
          })
          .from(tenantsTable)
          .where(eq(tenantsTable.id, ctx.user.tenantId))
          .limit(1);

        const [certificate] = await db
          .select({
            id: certificatesTable.id,
            verificationCode: certificatesTable.verificationCode,
            imageKey: certificatesTable.imageKey,
            userName: certificatesTable.userName,
            courseName: certificatesTable.courseName,
            issuedAt: certificatesTable.issuedAt,
            enrollmentId: certificatesTable.enrollmentId,
          })
          .from(certificatesTable)
          .where(
            and(
              eq(certificatesTable.enrollmentId, ctx.params.enrollmentId),
              eq(certificatesTable.userId, ctx.user.id),
              eq(certificatesTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!certificate) {
          return { certificate: null };
        }

        return {
          certificate: {
            id: certificate.id,
            verificationCode: certificate.verificationCode,
            imageUrl: certificate.imageKey
              ? getPresignedUrl(certificate.imageKey)
              : null,
            userName: certificate.userName,
            courseName: certificate.courseName,
            issuedAt: certificate.issuedAt,
            enrollmentId: certificate.enrollmentId,
            verificationUrl: tenant
              ? buildVerificationUrl(certificate.verificationCode, tenant.slug, tenant.customDomain)
              : `${env.CLIENT_URL}/verify/${certificate.verificationCode}`,
          },
        };
      },
    {
      params: t.Object({
        enrollmentId: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Certificates"],
        summary: "Get certificate by enrollment ID",
      },
    }
  )
  .post(
    "/:enrollmentId/email",
    async (ctx) => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }
        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const [certificate] = await db
          .select({
            imageKey: certificatesTable.imageKey,
            verificationCode: certificatesTable.verificationCode,
            userName: certificatesTable.userName,
            courseName: certificatesTable.courseName,
            tenantId: certificatesTable.tenantId,
          })
          .from(certificatesTable)
          .where(
            and(
              eq(certificatesTable.enrollmentId, ctx.params.enrollmentId),
              eq(certificatesTable.userId, ctx.user.id),
              eq(certificatesTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!certificate) {
          throw new AppError(ErrorCode.NOT_FOUND, "Certificate not found", 404);
        }

        const [tenant] = await db
          .select({
            name: tenantsTable.name,
            slug: tenantsTable.slug,
            customDomain: tenantsTable.customDomain,
            contactEmail: tenantsTable.contactEmail,
          })
          .from(tenantsTable)
          .where(eq(tenantsTable.id, certificate.tenantId))
          .limit(1);

        const verificationUrl = tenant
          ? buildVerificationUrl(certificate.verificationCode, tenant.slug, tenant.customDomain)
          : `${env.CLIENT_URL}/verify/${certificate.verificationCode}`;
        const downloadUrl = certificate.imageKey
          ? getPresignedUrl(certificate.imageKey)
          : verificationUrl;

        const emailHtml = getCertificateEmailHtml({
          studentName: certificate.userName,
          courseName: certificate.courseName,
          verificationUrl,
          downloadUrl,
          tenantName: tenant?.name || "LMS",
        });

        await sendEmail({
          to: ctx.user.email,
          subject: `Your Certificate of Completion - ${certificate.courseName}`,
          html: emailHtml,
          senderName: tenant?.name,
          replyTo: tenant?.contactEmail || undefined,
        });

        return { success: true };
      },
    {
      params: t.Object({
        enrollmentId: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Certificates"],
        summary: "Send certificate via email",
      },
    }
  )
  .get(
    "/verify/:code",
    async (ctx) => {
        const [certificate] = await db
          .select({
            id: certificatesTable.id,
            verificationCode: certificatesTable.verificationCode,
            imageKey: certificatesTable.imageKey,
            userName: certificatesTable.userName,
            courseName: certificatesTable.courseName,
            issuedAt: certificatesTable.issuedAt,
            tenant: {
              name: tenantsTable.name,
              logo: tenantsTable.logo,
              slug: tenantsTable.slug,
              customDomain: tenantsTable.customDomain,
            },
          })
          .from(certificatesTable)
          .innerJoin(tenantsTable, eq(certificatesTable.tenantId, tenantsTable.id))
          .where(eq(certificatesTable.verificationCode, ctx.params.code))
          .limit(1);

        if (!certificate) {
          return { valid: false, certificate: null };
        }

        return {
          valid: true,
          certificate: {
            id: certificate.id,
            verificationCode: certificate.verificationCode,
            imageUrl: certificate.imageKey
              ? getPresignedUrl(certificate.imageKey)
              : null,
            userName: certificate.userName,
            courseName: certificate.courseName,
            issuedAt: certificate.issuedAt,
            tenant: {
              name: certificate.tenant.name,
              logo: certificate.tenant.logo
                ? getPresignedUrl(certificate.tenant.logo)
                : null,
              slug: certificate.tenant.slug,
              customDomain: certificate.tenant.customDomain,
            },
          },
        };
      },
    {
      params: t.Object({
        code: t.String({ minLength: 8, maxLength: 8 }),
      }),
      detail: {
        tags: ["Certificates"],
        summary: "Verify certificate (public)",
      },
    }
  )
  .post(
    "/preview",
    async (ctx) => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }
        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManage =
          ctx.userRole === "owner" ||
          ctx.userRole === "instructor" ||
          ctx.userRole === "superadmin";

        if (!canManage) {
          throw new AppError(ErrorCode.FORBIDDEN, "Forbidden", 403);
        }

        const [tenant] = await db
          .select({
            name: tenantsTable.name,
            logo: tenantsTable.logo,
            customTheme: tenantsTable.customTheme,
            certificateSettings: tenantsTable.certificateSettings,
          })
          .from(tenantsTable)
          .where(eq(tenantsTable.id, ctx.user.tenantId))
          .limit(1);

        if (!tenant) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "Tenant not found", 404);
        }

        const locale = ctx.body.locale || "en";

        const imageDataUrl = await generateCertificatePreview({
          studentName: "John Doe",
          courseName: "Sample Course",
          issuedAt: new Date(),
          tenantLogo: tenant.logo || undefined,
          tenantName: tenant.name,
          theme: tenant.customTheme,
          certificateSettings: tenant.certificateSettings,
          locale,
        });

        return { imageUrl: imageDataUrl };
      },
    {
      body: t.Object({
        locale: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Certificates"],
        summary: "Generate certificate preview",
      },
    }
  )
  .post(
    "/:enrollmentId/regenerate",
    async (ctx) => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }
        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManage =
          ctx.userRole === "owner" ||
          ctx.userRole === "instructor" ||
          ctx.userRole === "superadmin";

        if (!canManage) {
          throw new AppError(ErrorCode.FORBIDDEN, "Forbidden", 403);
        }

        const [certificate] = await db
          .select({
            id: certificatesTable.id,
            tenantId: certificatesTable.tenantId,
          })
          .from(certificatesTable)
          .where(eq(certificatesTable.enrollmentId, ctx.params.enrollmentId))
          .limit(1);

        if (!certificate) {
          throw new AppError(ErrorCode.NOT_FOUND, "Certificate not found", 404);
        }

        if (certificate.tenantId !== ctx.user.tenantId) {
          throw new AppError(ErrorCode.FORBIDDEN, "Forbidden", 403);
        }

        const result = await regenerateCertificate({
          certificateId: certificate.id,
          tenantId: ctx.user.tenantId,
        });

        if (!result.success) {
          throw new AppError(
            ErrorCode.INTERNAL_SERVER_ERROR,
            "Failed to regenerate certificate",
            500
          );
        }

        return {
          success: true,
          imageUrl: result.imageKey ? getPresignedUrl(result.imageKey) : null,
        };
      },
    {
      params: t.Object({
        enrollmentId: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Certificates"],
        summary: "Regenerate certificate",
      },
    }
  )
  .post(
    "/regenerate-all",
    async (ctx) => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }
        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManage =
          ctx.userRole === "owner" ||
          ctx.userRole === "instructor" ||
          ctx.userRole === "superadmin";

        if (!canManage) {
          throw new AppError(ErrorCode.FORBIDDEN, "Forbidden", 403);
        }

        const certificates = await db
          .select({ id: certificatesTable.id })
          .from(certificatesTable)
          .where(eq(certificatesTable.tenantId, ctx.user.tenantId));

        let successCount = 0;
        let failCount = 0;

        for (const cert of certificates) {
          const result = await regenerateCertificate({
            certificateId: cert.id,
            tenantId: ctx.user.tenantId,
          });
          if (result.success) {
            successCount++;
          } else {
            failCount++;
          }
        }

        return {
          success: true,
          total: certificates.length,
          regenerated: successCount,
          failed: failCount,
        };
      },
    {
      detail: {
        tags: ["Certificates"],
        summary: "Regenerate all tenant certificates",
      },
    }
  );
