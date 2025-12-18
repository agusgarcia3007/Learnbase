import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { guardPlugin } from "@/plugins/guards";
import { jwtPlugin } from "@/plugins/jwt";
import { AppError, ErrorCode } from "@/lib/errors";
import { db } from "@/db";
import {
  instructorProfilesTable,
  usersTable,
  coursesTable,
  tenantsTable,
  type SelectInstructorProfile,
} from "@/db/schema";
import { count, eq, and, desc, inArray, ilike, or } from "drizzle-orm";
import {
  parseListParams,
  getPaginationParams,
  calculatePagination,
} from "@/lib/filters";
import { sendEmail } from "@/lib/utils";
import { getInvitationEmailHtml } from "@/lib/email-templates";
import { getPresignedUrl } from "@/lib/upload";
import { CLIENT_URL } from "@/lib/constants";

export const instructorsRoutes = new Elysia()
  .use(authPlugin)
  .use(guardPlugin)
  .use(jwtPlugin)
  .get(
    "/",
    async (ctx) => {
      const canManageInstructors =
        ctx.userRole === "owner" ||
        ctx.userRole === "instructor" ||
        ctx.userRole === "superadmin";

      if (!canManageInstructors) {
        throw new AppError(
          ErrorCode.FORBIDDEN,
          "Only owners and instructors can manage instructors",
          403
        );
      }

      const params = parseListParams(ctx.query);
      const { limit, offset } = getPaginationParams(params.page, params.limit);

      const tenantFilter = eq(instructorProfilesTable.tenantId, ctx.user!.tenantId!);

      const searchFilter = params.search
        ? or(
            ilike(usersTable.name, `%${params.search}%`),
            ilike(instructorProfilesTable.title, `%${params.search}%`)
          )
        : undefined;

      const whereClause = searchFilter
        ? and(tenantFilter, searchFilter)
        : tenantFilter;

      const instructorsQuery = db
        .select({
          profile: instructorProfilesTable,
          user: {
            id: usersTable.id,
            name: usersTable.name,
            email: usersTable.email,
            avatar: usersTable.avatar,
            role: usersTable.role,
          },
        })
        .from(instructorProfilesTable)
        .innerJoin(usersTable, eq(instructorProfilesTable.userId, usersTable.id))
        .where(whereClause)
        .orderBy(instructorProfilesTable.order)
        .limit(limit)
        .offset(offset);

      const countQuery = db
        .select({ count: count() })
        .from(instructorProfilesTable)
        .innerJoin(usersTable, eq(instructorProfilesTable.userId, usersTable.id))
        .where(whereClause);

      const [instructors, [{ count: total }]] = await Promise.all([
        instructorsQuery,
        countQuery,
      ]);

      const profileIds = instructors.map((i) => i.profile.id);

      const coursesCounts =
        profileIds.length > 0
          ? await db
              .select({
                instructorId: coursesTable.instructorId,
                count: count(),
              })
              .from(coursesTable)
              .where(
                and(
                  eq(coursesTable.tenantId, ctx.user!.tenantId!),
                  inArray(coursesTable.instructorId, profileIds)
                )
              )
              .groupBy(coursesTable.instructorId)
          : [];

      const coursesCountMap = new Map(
        coursesCounts.map((cc) => [cc.instructorId, cc.count])
      );

      const instructorsWithCounts = instructors.map(({ profile, user }) => ({
        id: profile.id,
        tenantId: profile.tenantId,
        userId: user.id,
        name: user.name,
        email: profile.email || user.email,
        avatar: user.avatar ? getPresignedUrl(user.avatar) : null,
        bio: profile.bio,
        title: profile.title,
        website: profile.website,
        socialLinks: profile.socialLinks,
        order: profile.order,
        isOwner: user.role === "owner",
        coursesCount: coursesCountMap.get(profile.id) ?? 0,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      }));

      return {
        instructors: instructorsWithCounts,
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
        tags: ["Instructors"],
        summary: "List instructors with pagination and filters",
      },
      requireAuth: true,
      requireTenant: true,
    }
  )
  .get(
    "/:id",
    async (ctx) => {
      const [result] = await db
        .select({
          profile: instructorProfilesTable,
          user: {
            id: usersTable.id,
            name: usersTable.name,
            email: usersTable.email,
            avatar: usersTable.avatar,
            role: usersTable.role,
          },
        })
        .from(instructorProfilesTable)
        .innerJoin(usersTable, eq(instructorProfilesTable.userId, usersTable.id))
        .where(
          and(
            eq(instructorProfilesTable.id, ctx.params.id),
            eq(instructorProfilesTable.tenantId, ctx.user!.tenantId!)
          )
        )
        .limit(1);

      if (!result) {
        throw new AppError(ErrorCode.NOT_FOUND, "Instructor not found", 404);
      }

      const [coursesCount] = await db
        .select({ count: count() })
        .from(coursesTable)
        .where(
          and(
            eq(coursesTable.instructorId, result.profile.id),
            eq(coursesTable.tenantId, ctx.user!.tenantId!)
          )
        );

      return {
        instructor: {
          id: result.profile.id,
          tenantId: result.profile.tenantId,
          userId: result.user.id,
          name: result.user.name,
          email: result.profile.email || result.user.email,
          avatar: result.user.avatar ? getPresignedUrl(result.user.avatar) : null,
          bio: result.profile.bio,
          title: result.profile.title,
          website: result.profile.website,
          socialLinks: result.profile.socialLinks,
          order: result.profile.order,
          isOwner: result.user.role === "owner",
          coursesCount: coursesCount.count,
          createdAt: result.profile.createdAt,
          updatedAt: result.profile.updatedAt,
        },
      };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Instructors"],
        summary: "Get instructor by ID",
      },
      requireAuth: true,
      requireTenant: true,
    }
  )
  .post(
    "/invite",
    async (ctx) => {
      const [existing] = await db
        .select()
        .from(usersTable)
        .where(
          and(
            eq(usersTable.email, ctx.body.email),
            eq(usersTable.tenantId, ctx.user!.tenantId!)
          )
        )
        .limit(1);

      if (existing) {
        const [existingProfile] = await db
          .select()
          .from(instructorProfilesTable)
          .where(
            and(
              eq(instructorProfilesTable.userId, existing.id),
              eq(instructorProfilesTable.tenantId, ctx.user!.tenantId!)
            )
          )
          .limit(1);

        return {
          userExists: true as const,
          existingUser: {
            id: existing.id,
            name: existing.name,
            email: existing.email,
            role: existing.role,
            avatar: existing.avatar ? getPresignedUrl(existing.avatar) : null,
            hasInstructorProfile: !!existingProfile,
          },
        };
      }

      const [tenant] = await db
        .select()
        .from(tenantsTable)
        .where(eq(tenantsTable.id, ctx.user!.tenantId!))
        .limit(1);

      if (!tenant) {
        throw new AppError(ErrorCode.TENANT_NOT_FOUND, "Tenant not found", 404);
      }

      const randomPassword = crypto.randomUUID();
      const hashedPassword = await Bun.password.hash(randomPassword);

      const [newUser] = await db
        .insert(usersTable)
        .values({
          email: ctx.body.email,
          password: hashedPassword,
          name: ctx.body.name,
          role: "instructor",
          tenantId: ctx.user!.tenantId!,
        })
        .returning();

      const [maxOrder] = await db
        .select({ maxOrder: instructorProfilesTable.order })
        .from(instructorProfilesTable)
        .where(eq(instructorProfilesTable.tenantId, ctx.user!.tenantId!))
        .orderBy(desc(instructorProfilesTable.order))
        .limit(1);

      const nextOrder = (maxOrder?.maxOrder ?? -1) + 1;

      const [profile] = await db
        .insert(instructorProfilesTable)
        .values({
          tenantId: ctx.user!.tenantId!,
          userId: newUser.id,
          title: ctx.body.title,
          order: nextOrder,
        })
        .returning();

      const resetToken = await ctx.resetJwt.sign({ sub: newUser.id });
      const resetUrl = `${CLIENT_URL}/reset-password?token=${resetToken}`;

      const logoUrl = tenant.logo ? getPresignedUrl(tenant.logo) : undefined;

      await sendEmail({
        to: ctx.body.email,
        subject: `You've been invited to ${tenant.name} as an instructor`,
        html: getInvitationEmailHtml({
          recipientName: ctx.body.name,
          tenantName: tenant.name,
          inviterName: ctx.user!.name,
          resetUrl,
          logoUrl,
        }),
        senderName: tenant.name,
        replyTo: tenant.contactEmail || undefined,
      });

      return {
        userExists: false as const,
        instructor: {
          id: profile.id,
          tenantId: profile.tenantId,
          userId: newUser.id,
          name: newUser.name,
          email: newUser.email,
          avatar: null,
          bio: profile.bio,
          title: profile.title,
          website: profile.website,
          socialLinks: profile.socialLinks,
          order: profile.order,
          isOwner: false,
          coursesCount: 0,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt,
        },
      };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        name: t.String({ minLength: 1 }),
        title: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Instructors"],
        summary: "Invite a new instructor (creates user and sends email)",
      },
      requireAuth: true,
      requireTenant: true,
      requireRole: ["owner", "superadmin"],
    }
  )
  .post(
    "/promote/:userId",
    async (ctx) => {
      const [existingUser] = await db
        .select()
        .from(usersTable)
        .where(
          and(
            eq(usersTable.id, ctx.params.userId),
            eq(usersTable.tenantId, ctx.user!.tenantId!)
          )
        )
        .limit(1);

      if (!existingUser) {
        throw new AppError(ErrorCode.NOT_FOUND, "User not found", 404);
      }

      const [existingProfile] = await db
        .select()
        .from(instructorProfilesTable)
        .where(
          and(
            eq(instructorProfilesTable.userId, existingUser.id),
            eq(instructorProfilesTable.tenantId, ctx.user!.tenantId!)
          )
        )
        .limit(1);

      if (existingProfile) {
        throw new AppError(
          ErrorCode.CONFLICT,
          "User already has an instructor profile",
          409
        );
      }

      await db
        .update(usersTable)
        .set({ role: "instructor" })
        .where(eq(usersTable.id, existingUser.id));

      const [maxOrder] = await db
        .select({ maxOrder: instructorProfilesTable.order })
        .from(instructorProfilesTable)
        .where(eq(instructorProfilesTable.tenantId, ctx.user!.tenantId!))
        .orderBy(desc(instructorProfilesTable.order))
        .limit(1);

      const nextOrder = (maxOrder?.maxOrder ?? -1) + 1;

      const [profile] = await db
        .insert(instructorProfilesTable)
        .values({
          tenantId: ctx.user!.tenantId!,
          userId: existingUser.id,
          title: ctx.body.title,
          order: nextOrder,
        })
        .returning();

      return {
        instructor: {
          id: profile.id,
          tenantId: profile.tenantId,
          userId: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          avatar: existingUser.avatar
            ? getPresignedUrl(existingUser.avatar)
            : null,
          bio: profile.bio,
          title: profile.title,
          website: profile.website,
          socialLinks: profile.socialLinks,
          order: profile.order,
          isOwner: existingUser.role === "owner",
          coursesCount: 0,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt,
        },
      };
    },
    {
      params: t.Object({
        userId: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        title: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Instructors"],
        summary: "Promote existing user to instructor role",
      },
      requireAuth: true,
      requireTenant: true,
      requireRole: ["owner", "superadmin"],
    }
  )
  .put(
    "/:id",
    async (ctx) => {
      const canManageInstructors =
        ctx.userRole === "owner" ||
        ctx.userRole === "instructor" ||
        ctx.userRole === "superadmin";

      if (!canManageInstructors) {
        throw new AppError(
          ErrorCode.FORBIDDEN,
          "Only owners and instructors can update instructors",
          403
        );
      }

      const [existingResult] = await db
        .select({
          profile: instructorProfilesTable,
          user: {
            id: usersTable.id,
            name: usersTable.name,
            email: usersTable.email,
            avatar: usersTable.avatar,
            role: usersTable.role,
          },
        })
        .from(instructorProfilesTable)
        .innerJoin(usersTable, eq(instructorProfilesTable.userId, usersTable.id))
        .where(
          and(
            eq(instructorProfilesTable.id, ctx.params.id),
            eq(instructorProfilesTable.tenantId, ctx.user!.tenantId!)
          )
        )
        .limit(1);

      if (!existingResult) {
        throw new AppError(ErrorCode.NOT_FOUND, "Instructor not found", 404);
      }

      const updateData: Partial<SelectInstructorProfile> = {};
      if (ctx.body.bio !== undefined) updateData.bio = ctx.body.bio;
      if (ctx.body.title !== undefined) updateData.title = ctx.body.title;
      if (ctx.body.email !== undefined) updateData.email = ctx.body.email;
      if (ctx.body.website !== undefined) updateData.website = ctx.body.website;
      if (ctx.body.socialLinks !== undefined)
        updateData.socialLinks = ctx.body.socialLinks;
      if (ctx.body.order !== undefined) updateData.order = ctx.body.order;

      const [updatedProfile] = await db
        .update(instructorProfilesTable)
        .set(updateData)
        .where(eq(instructorProfilesTable.id, ctx.params.id))
        .returning();

      const [coursesCount] = await db
        .select({ count: count() })
        .from(coursesTable)
        .where(
          and(
            eq(coursesTable.instructorId, ctx.params.id),
            eq(coursesTable.tenantId, ctx.user!.tenantId!)
          )
        );

      return {
        instructor: {
          id: updatedProfile.id,
          tenantId: updatedProfile.tenantId,
          userId: existingResult.user.id,
          name: existingResult.user.name,
          email: updatedProfile.email || existingResult.user.email,
          avatar: existingResult.user.avatar
            ? getPresignedUrl(existingResult.user.avatar)
            : null,
          bio: updatedProfile.bio,
          title: updatedProfile.title,
          website: updatedProfile.website,
          socialLinks: updatedProfile.socialLinks,
          order: updatedProfile.order,
          isOwner: existingResult.user.role === "owner",
          coursesCount: coursesCount.count,
          createdAt: updatedProfile.createdAt,
          updatedAt: updatedProfile.updatedAt,
        },
      };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        bio: t.Optional(t.Union([t.String(), t.Null()])),
        title: t.Optional(t.Union([t.String(), t.Null()])),
        email: t.Optional(t.Union([t.String(), t.Null()])),
        website: t.Optional(t.Union([t.String(), t.Null()])),
        socialLinks: t.Optional(
          t.Union([
            t.Object({
              twitter: t.Optional(t.String()),
              linkedin: t.Optional(t.String()),
              github: t.Optional(t.String()),
            }),
            t.Null(),
          ])
        ),
        order: t.Optional(t.Number({ minimum: 0 })),
      }),
      detail: {
        tags: ["Instructors"],
        summary: "Update an instructor profile",
      },
      requireAuth: true,
      requireTenant: true,
    }
  )
  .delete(
    "/:id",
    async (ctx) => {
      const [existingResult] = await db
        .select({
          profile: instructorProfilesTable,
          userRole: usersTable.role,
        })
        .from(instructorProfilesTable)
        .innerJoin(usersTable, eq(instructorProfilesTable.userId, usersTable.id))
        .where(
          and(
            eq(instructorProfilesTable.id, ctx.params.id),
            eq(instructorProfilesTable.tenantId, ctx.user!.tenantId!)
          )
        )
        .limit(1);

      if (!existingResult) {
        throw new AppError(ErrorCode.NOT_FOUND, "Instructor not found", 404);
      }

      if (existingResult.userRole === "owner") {
        throw new AppError(
          ErrorCode.FORBIDDEN,
          "Cannot remove owner as instructor",
          403
        );
      }

      await db
        .delete(instructorProfilesTable)
        .where(eq(instructorProfilesTable.id, ctx.params.id));

      return { success: true };
    },
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Instructors"],
        summary: "Remove an instructor (does not delete user account)",
      },
      requireAuth: true,
      requireTenant: true,
      requireRole: ["owner", "superadmin"],
    }
  );
