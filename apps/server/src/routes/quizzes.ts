import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { AppError, ErrorCode } from "@/lib/errors";
import { withHandler } from "@/lib/handler";
import { db } from "@/db";
import {
  quizzesTable,
  quizQuestionsTable,
  quizOptionsTable,
  questionTypeEnum,
  contentStatusEnum,
  moduleItemsTable,
  type SelectQuiz,
} from "@/db/schema";
import { count, eq, and, asc, inArray, sql, max, getTableColumns } from "drizzle-orm";
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

const quizFieldMap: FieldMap<typeof quizzesTable> = {
  id: quizzesTable.id,
  title: quizzesTable.title,
  status: quizzesTable.status,
  createdAt: quizzesTable.createdAt,
  updatedAt: quizzesTable.updatedAt,
};

const quizSearchableFields: SearchableFields<typeof quizzesTable> = [
  quizzesTable.title,
];

const quizDateFields: DateFields = new Set(["createdAt"]);

export const quizzesRoutes = new Elysia()
  .use(authPlugin)
  .get(
    "/",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManage =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManage) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can manage quizzes",
            403
          );
        }

        const params = parseListParams(ctx.query);
        const baseWhereClause = buildWhereClause(
          params,
          quizFieldMap,
          quizSearchableFields,
          quizDateFields
        );

        const tenantFilter = eq(quizzesTable.tenantId, ctx.user.tenantId);

        const whereClause = baseWhereClause
          ? and(baseWhereClause, tenantFilter)
          : tenantFilter;

        const sortColumn = getSortColumn(params.sort, quizFieldMap, {
          field: "createdAt",
          order: "desc",
        });
        const { limit, offset } = getPaginationParams(params.page, params.limit);

        const [quizzesRaw, [{ count: total }]] = await Promise.all([
          db
            .select({
              ...getTableColumns(quizzesTable),
              questionCount: count(quizQuestionsTable.id),
            })
            .from(quizzesTable)
            .leftJoin(
              quizQuestionsTable,
              eq(quizzesTable.id, quizQuestionsTable.quizId)
            )
            .where(whereClause)
            .groupBy(quizzesTable.id)
            .orderBy(sortColumn ?? quizzesTable.createdAt)
            .limit(limit)
            .offset(offset),
          db
            .select({ count: count() })
            .from(quizzesTable)
            .where(whereClause),
        ]);

        const quizzes = quizzesRaw.map((q) => ({
          ...q,
          questionCount: Number(q.questionCount),
        }));

        return {
          quizzes,
          pagination: calculatePagination(total, params.page, params.limit),
        };
      }),
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        sort: t.Optional(t.String()),
        search: t.Optional(t.String()),
        status: t.Optional(t.String()),
        createdAt: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Quizzes"],
        summary: "List quizzes with pagination and filters",
      },
    }
  )
  .get(
    "/:id",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const [quiz] = await db
          .select()
          .from(quizzesTable)
          .where(
            and(
              eq(quizzesTable.id, ctx.params.id),
              eq(quizzesTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!quiz) {
          throw new AppError(ErrorCode.NOT_FOUND, "Quiz not found", 404);
        }

        return { quiz };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Quizzes"],
        summary: "Get quiz by ID",
      },
    }
  )
  .post(
    "/",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManage =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManage) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can create quizzes",
            403
          );
        }

        const [quiz] = await db
          .insert(quizzesTable)
          .values({
            tenantId: ctx.user.tenantId,
            title: ctx.body.title,
            description: ctx.body.description,
            status: ctx.body.status ?? "draft",
          })
          .returning();

        return { quiz };
      }),
    {
      body: t.Object({
        title: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        status: t.Optional(t.Enum(Object.fromEntries(contentStatusEnum.enumValues.map((v) => [v, v])))),
      }),
      detail: {
        tags: ["Quizzes"],
        summary: "Create a new quiz",
      },
    }
  )
  .put(
    "/:id",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManage =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManage) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can update quizzes",
            403
          );
        }

        const [existingQuiz] = await db
          .select({ id: quizzesTable.id })
          .from(quizzesTable)
          .where(
            and(
              eq(quizzesTable.id, ctx.params.id),
              eq(quizzesTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!existingQuiz) {
          throw new AppError(ErrorCode.NOT_FOUND, "Quiz not found", 404);
        }

        const updateData: Partial<SelectQuiz> = {};
        if (ctx.body.title !== undefined) updateData.title = ctx.body.title;
        if (ctx.body.description !== undefined) updateData.description = ctx.body.description;
        if (ctx.body.status !== undefined) updateData.status = ctx.body.status;

        const [updatedQuiz] = await db
          .update(quizzesTable)
          .set(updateData)
          .where(eq(quizzesTable.id, ctx.params.id))
          .returning();

        return { quiz: updatedQuiz };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        title: t.Optional(t.String({ minLength: 1 })),
        description: t.Optional(t.Union([t.String(), t.Null()])),
        status: t.Optional(t.Enum(Object.fromEntries(contentStatusEnum.enumValues.map((v) => [v, v])))),
      }),
      detail: {
        tags: ["Quizzes"],
        summary: "Update a quiz",
      },
    }
  )
  .delete(
    "/:id",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManage =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManage) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can delete quizzes",
            403
          );
        }

        const [existingQuiz] = await db
          .select({ id: quizzesTable.id })
          .from(quizzesTable)
          .where(
            and(
              eq(quizzesTable.id, ctx.params.id),
              eq(quizzesTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!existingQuiz) {
          throw new AppError(ErrorCode.NOT_FOUND, "Quiz not found", 404);
        }

        await db
          .delete(moduleItemsTable)
          .where(
            and(
              eq(moduleItemsTable.contentType, "quiz"),
              eq(moduleItemsTable.contentId, ctx.params.id)
            )
          );

        await db.delete(quizzesTable).where(eq(quizzesTable.id, ctx.params.id));

        return { success: true };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Quizzes"],
        summary: "Delete a quiz",
      },
    }
  )
  .get(
    "/:id/questions",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const [[quiz], questions] = await Promise.all([
          db
            .select({ id: quizzesTable.id })
            .from(quizzesTable)
            .where(
              and(
                eq(quizzesTable.id, ctx.params.id),
                eq(quizzesTable.tenantId, ctx.user.tenantId)
              )
            )
            .limit(1),
          db
            .select()
            .from(quizQuestionsTable)
            .where(eq(quizQuestionsTable.quizId, ctx.params.id))
            .orderBy(asc(quizQuestionsTable.order)),
        ]);

        if (!quiz) {
          throw new AppError(ErrorCode.NOT_FOUND, "Quiz not found", 404);
        }

        if (questions.length === 0) {
          return { questions: [] };
        }

        const questionIds = questions.map((q) => q.id);

        const allOptions = await db
          .select()
          .from(quizOptionsTable)
          .where(inArray(quizOptionsTable.questionId, questionIds))
          .orderBy(asc(quizOptionsTable.order));

        const optionsByQuestion = allOptions.reduce(
          (acc, option) => {
            if (!acc[option.questionId]) {
              acc[option.questionId] = [];
            }
            acc[option.questionId].push(option);
            return acc;
          },
          {} as Record<string, typeof allOptions>
        );

        const questionsWithOptions = questions.map((question) => ({
          ...question,
          options: optionsByQuestion[question.id] || [],
        }));

        return { questions: questionsWithOptions };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Quizzes"],
        summary: "Get all questions for a quiz",
      },
    }
  )
  .post(
    "/:id/questions",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManage =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManage) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can create questions",
            403
          );
        }

        const [[quiz], [{ maxOrder }]] = await Promise.all([
          db
            .select({ id: quizzesTable.id })
            .from(quizzesTable)
            .where(
              and(
                eq(quizzesTable.id, ctx.params.id),
                eq(quizzesTable.tenantId, ctx.user.tenantId)
              )
            )
            .limit(1),
          db
            .select({ maxOrder: max(quizQuestionsTable.order) })
            .from(quizQuestionsTable)
            .where(eq(quizQuestionsTable.quizId, ctx.params.id)),
        ]);

        if (!quiz) {
          throw new AppError(ErrorCode.NOT_FOUND, "Quiz not found", 404);
        }

        const nextOrder = (maxOrder ?? -1) + 1;

        const [question] = await db
          .insert(quizQuestionsTable)
          .values({
            quizId: ctx.params.id,
            tenantId: ctx.user.tenantId,
            type: ctx.body.type,
            questionText: ctx.body.questionText,
            explanation: ctx.body.explanation,
            order: nextOrder,
          })
          .returning();

        let options: typeof quizOptionsTable.$inferSelect[] = [];

        if (ctx.body.options && ctx.body.options.length > 0) {
          options = await db
            .insert(quizOptionsTable)
            .values(
              ctx.body.options.map((opt, index) => ({
                questionId: question.id,
                optionText: opt.optionText,
                isCorrect: opt.isCorrect,
                order: index,
              }))
            )
            .returning();
        }

        return { question: { ...question, options } };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        type: t.Enum(
          Object.fromEntries(questionTypeEnum.enumValues.map((v) => [v, v]))
        ),
        questionText: t.String({ minLength: 1 }),
        explanation: t.Optional(t.String()),
        options: t.Optional(
          t.Array(
            t.Object({
              optionText: t.String({ minLength: 1 }),
              isCorrect: t.Boolean(),
            })
          )
        ),
      }),
      detail: {
        tags: ["Quizzes"],
        summary: "Create a question for a quiz",
      },
    }
  )
  .put(
    "/questions/:id",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManage =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManage) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can update questions",
            403
          );
        }

        const [existingQuestion] = await db
          .select({ id: quizQuestionsTable.id })
          .from(quizQuestionsTable)
          .where(
            and(
              eq(quizQuestionsTable.id, ctx.params.id),
              eq(quizQuestionsTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!existingQuestion) {
          throw new AppError(ErrorCode.NOT_FOUND, "Question not found", 404);
        }

        const updateData: Partial<typeof quizQuestionsTable.$inferInsert> = {};
        if (ctx.body.type !== undefined) updateData.type = ctx.body.type;
        if (ctx.body.questionText !== undefined)
          updateData.questionText = ctx.body.questionText;
        if (ctx.body.explanation !== undefined)
          updateData.explanation = ctx.body.explanation;
        if (ctx.body.order !== undefined) updateData.order = ctx.body.order;

        const [updatedQuestion] = await db
          .update(quizQuestionsTable)
          .set(updateData)
          .where(eq(quizQuestionsTable.id, ctx.params.id))
          .returning();

        const options = await db
          .select()
          .from(quizOptionsTable)
          .where(eq(quizOptionsTable.questionId, ctx.params.id))
          .orderBy(asc(quizOptionsTable.order));

        return { question: { ...updatedQuestion, options } };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        type: t.Optional(
          t.Enum(
            Object.fromEntries(questionTypeEnum.enumValues.map((v) => [v, v]))
          )
        ),
        questionText: t.Optional(t.String({ minLength: 1 })),
        explanation: t.Optional(t.Union([t.String(), t.Null()])),
        order: t.Optional(t.Number({ minimum: 0 })),
      }),
      detail: {
        tags: ["Quizzes"],
        summary: "Update a question",
      },
    }
  )
  .delete(
    "/questions/:id",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManage =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManage) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can delete questions",
            403
          );
        }

        const [existingQuestion] = await db
          .select({ id: quizQuestionsTable.id })
          .from(quizQuestionsTable)
          .where(
            and(
              eq(quizQuestionsTable.id, ctx.params.id),
              eq(quizQuestionsTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!existingQuestion) {
          throw new AppError(ErrorCode.NOT_FOUND, "Question not found", 404);
        }

        await db
          .delete(quizQuestionsTable)
          .where(eq(quizQuestionsTable.id, ctx.params.id));

        return { success: true };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Quizzes"],
        summary: "Delete a question",
      },
    }
  )
  .put(
    "/:id/questions/reorder",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManage =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManage) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can reorder questions",
            403
          );
        }

        const [quiz] = await db
          .select({ id: quizzesTable.id })
          .from(quizzesTable)
          .where(
            and(
              eq(quizzesTable.id, ctx.params.id),
              eq(quizzesTable.tenantId, ctx.user.tenantId)
            )
          )
          .limit(1);

        if (!quiz) {
          throw new AppError(ErrorCode.NOT_FOUND, "Quiz not found", 404);
        }

        if (ctx.body.questionIds.length > 0) {
          const caseStatements = ctx.body.questionIds
            .map((id, index) => sql`WHEN ${id} THEN ${index}`)
            .reduce((acc, curr) => sql`${acc} ${curr}`);

          await db.execute(sql`
            UPDATE quiz_questions
            SET "order" = CASE id ${caseStatements} END
            WHERE id IN ${ctx.body.questionIds}
            AND quiz_id = ${ctx.params.id}
          `);
        }

        return { success: true };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        questionIds: t.Array(t.String({ format: "uuid" })),
      }),
      detail: {
        tags: ["Quizzes"],
        summary: "Reorder questions in a quiz",
      },
    }
  )
  .post(
    "/questions/:id/options",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManage =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManage) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can add options",
            403
          );
        }

        const [[question], [{ maxOrder }]] = await Promise.all([
          db
            .select({ id: quizQuestionsTable.id })
            .from(quizQuestionsTable)
            .where(
              and(
                eq(quizQuestionsTable.id, ctx.params.id),
                eq(quizQuestionsTable.tenantId, ctx.user.tenantId)
              )
            )
            .limit(1),
          db
            .select({ maxOrder: max(quizOptionsTable.order) })
            .from(quizOptionsTable)
            .where(eq(quizOptionsTable.questionId, ctx.params.id)),
        ]);

        if (!question) {
          throw new AppError(ErrorCode.NOT_FOUND, "Question not found", 404);
        }

        const nextOrder = (maxOrder ?? -1) + 1;

        const [option] = await db
          .insert(quizOptionsTable)
          .values({
            questionId: ctx.params.id,
            optionText: ctx.body.optionText,
            isCorrect: ctx.body.isCorrect,
            order: nextOrder,
          })
          .returning();

        return { option };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        optionText: t.String({ minLength: 1 }),
        isCorrect: t.Boolean(),
      }),
      detail: {
        tags: ["Quizzes"],
        summary: "Add option to a question",
      },
    }
  )
  .put(
    "/options/:id",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManage =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManage) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can update options",
            403
          );
        }

        const [existingOption] = await db
          .select({
            optionId: quizOptionsTable.id,
            tenantId: quizQuestionsTable.tenantId,
          })
          .from(quizOptionsTable)
          .innerJoin(
            quizQuestionsTable,
            eq(quizOptionsTable.questionId, quizQuestionsTable.id)
          )
          .where(eq(quizOptionsTable.id, ctx.params.id))
          .limit(1);

        if (!existingOption) {
          throw new AppError(ErrorCode.NOT_FOUND, "Option not found", 404);
        }

        if (existingOption.tenantId !== ctx.user.tenantId) {
          throw new AppError(ErrorCode.FORBIDDEN, "Access denied", 403);
        }

        const updateData: Partial<typeof quizOptionsTable.$inferInsert> = {};
        if (ctx.body.optionText !== undefined)
          updateData.optionText = ctx.body.optionText;
        if (ctx.body.isCorrect !== undefined)
          updateData.isCorrect = ctx.body.isCorrect;
        if (ctx.body.order !== undefined) updateData.order = ctx.body.order;

        const [updatedOption] = await db
          .update(quizOptionsTable)
          .set(updateData)
          .where(eq(quizOptionsTable.id, ctx.params.id))
          .returning();

        return { option: updatedOption };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      body: t.Object({
        optionText: t.Optional(t.String({ minLength: 1 })),
        isCorrect: t.Optional(t.Boolean()),
        order: t.Optional(t.Number({ minimum: 0 })),
      }),
      detail: {
        tags: ["Quizzes"],
        summary: "Update an option",
      },
    }
  )
  .delete(
    "/options/:id",
    (ctx) =>
      withHandler(ctx, async () => {
        if (!ctx.user) {
          throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
        }

        if (!ctx.user.tenantId) {
          throw new AppError(ErrorCode.TENANT_NOT_FOUND, "User has no tenant", 404);
        }

        const canManage =
          ctx.userRole === "owner" ||
          ctx.userRole === "admin" ||
          ctx.userRole === "superadmin";

        if (!canManage) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "Only owners and admins can delete options",
            403
          );
        }

        const [existingOption] = await db
          .select({
            optionId: quizOptionsTable.id,
            tenantId: quizQuestionsTable.tenantId,
          })
          .from(quizOptionsTable)
          .innerJoin(
            quizQuestionsTable,
            eq(quizOptionsTable.questionId, quizQuestionsTable.id)
          )
          .where(eq(quizOptionsTable.id, ctx.params.id))
          .limit(1);

        if (!existingOption) {
          throw new AppError(ErrorCode.NOT_FOUND, "Option not found", 404);
        }

        if (existingOption.tenantId !== ctx.user.tenantId) {
          throw new AppError(ErrorCode.FORBIDDEN, "Access denied", 403);
        }

        await db
          .delete(quizOptionsTable)
          .where(eq(quizOptionsTable.id, ctx.params.id));

        return { success: true };
      }),
    {
      params: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      detail: {
        tags: ["Quizzes"],
        summary: "Delete an option",
      },
    }
  );
