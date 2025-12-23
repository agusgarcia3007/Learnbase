import { tool } from "ai";
import { z } from 'zod/v3';
import { db } from "@/db";
import {
  videosTable,
  documentsTable,
  quizzesTable,
  moduleItemsTable,
  courseModulesTable,
} from "@/db/schema";
import { eq, and, ilike, or, inArray } from "drizzle-orm";
import { logger } from "@/lib/logger";

export const getCurrentContextSchema = z.object({
  includeFullDescription: z
    .boolean()
    .optional()
    .default(false)
    .describe("Whether to include the full description of the current item"),
});

export const searchCourseContentSchema = z.object({
  query: z
    .string()
    .describe("Search query to find content within the current course"),
  contentTypes: z
    .array(z.enum(["video", "document", "quiz"]))
    .optional()
    .describe("Filter by content types. If not provided, searches all types"),
});

export const getTranscriptSchema = z.object({
  aroundTimestamp: z
    .number()
    .optional()
    .describe(
      "Optional timestamp in seconds to focus the response around that point in the video"
    ),
});

export type LearnContext = {
  courseId: string;
  courseTitle: string;
  enrollmentProgress: number;
  itemId: string;
  itemTitle: string;
  itemType: "video" | "document" | "quiz";
  itemDescription: string | null;
  currentTime: number;
  duration: number | null;
  transcript: string | null;
  modules: Array<{
    id: string;
    title: string;
    items: Array<{
      id: string;
      title: string;
      type: string;
    }>;
  }>;
};

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function createLearnAssistantTools(
  tenantId: string,
  context: LearnContext
) {
  return {
    getCurrentContext: tool({
      description:
        "Get detailed information about what the student is currently viewing, including the video timestamp",
      inputSchema: getCurrentContextSchema,
      execute: async ({ includeFullDescription }) => {
        const result: Record<string, unknown> = {
          course: {
            title: context.courseTitle,
            progress: `${context.enrollmentProgress}%`,
          },
          currentItem: {
            title: context.itemTitle,
            type: context.itemType,
          },
        };

        if (context.itemType === "video") {
          const currentItem = result.currentItem as Record<string, unknown>;
          result.currentItem = {
            ...currentItem,
            currentTime: formatTimestamp(context.currentTime),
            currentTimeSeconds: context.currentTime,
            duration: context.duration
              ? formatTimestamp(context.duration)
              : null,
            durationSeconds: context.duration,
          };
        }

        if (includeFullDescription && context.itemDescription) {
          (result.currentItem as Record<string, unknown>).description =
            context.itemDescription;
        }

        logger.info("getCurrentContext executed", {
          itemId: context.itemId,
          itemType: context.itemType,
        });

        return result;
      },
    }),

    searchCourseContent: tool({
      description:
        "Search through all content in the current course to find relevant videos, documents, or quizzes",
      inputSchema: searchCourseContentSchema,
      execute: async ({ query, contentTypes }) => {
        const courseModules = await db
          .select({ moduleId: courseModulesTable.moduleId })
          .from(courseModulesTable)
          .where(eq(courseModulesTable.courseId, context.courseId));

        const moduleIds = courseModules.map((m) => m.moduleId);

        if (moduleIds.length === 0) {
          return { results: [], message: "No modules found in course" };
        }

        const items = await db
          .select({
            contentType: moduleItemsTable.contentType,
            contentId: moduleItemsTable.contentId,
          })
          .from(moduleItemsTable)
          .where(inArray(moduleItemsTable.moduleId, moduleIds));

        const types = contentTypes || ["video", "document", "quiz"];
        const results: Array<{
          type: string;
          id: string;
          title: string;
          description: string | null;
        }> = [];

        if (types.includes("video")) {
          const videoIds = items
            .filter((i) => i.contentType === "video")
            .map((i) => i.contentId);
          if (videoIds.length > 0) {
            const videos = await db
              .select({
                id: videosTable.id,
                title: videosTable.title,
                description: videosTable.description,
              })
              .from(videosTable)
              .where(
                and(
                  eq(videosTable.tenantId, tenantId),
                  inArray(videosTable.id, videoIds),
                  or(
                    ilike(videosTable.title, `%${query}%`),
                    ilike(videosTable.description, `%${query}%`)
                  )
                )
              );

            for (const video of videos) {
              results.push({
                type: "video",
                id: video.id,
                title: video.title,
                description: video.description,
              });
            }
          }
        }

        if (types.includes("document")) {
          const documentIds = items
            .filter((i) => i.contentType === "document")
            .map((i) => i.contentId);
          if (documentIds.length > 0) {
            const documents = await db
              .select({
                id: documentsTable.id,
                title: documentsTable.title,
                description: documentsTable.description,
              })
              .from(documentsTable)
              .where(
                and(
                  eq(documentsTable.tenantId, tenantId),
                  inArray(documentsTable.id, documentIds),
                  or(
                    ilike(documentsTable.title, `%${query}%`),
                    ilike(documentsTable.description, `%${query}%`)
                  )
                )
              );

            for (const doc of documents) {
              results.push({
                type: "document",
                id: doc.id,
                title: doc.title,
                description: doc.description,
              });
            }
          }
        }

        if (types.includes("quiz")) {
          const quizIds = items
            .filter((i) => i.contentType === "quiz")
            .map((i) => i.contentId);
          if (quizIds.length > 0) {
            const quizzes = await db
              .select({
                id: quizzesTable.id,
                title: quizzesTable.title,
                description: quizzesTable.description,
              })
              .from(quizzesTable)
              .where(
                and(
                  eq(quizzesTable.tenantId, tenantId),
                  inArray(quizzesTable.id, quizIds),
                  or(
                    ilike(quizzesTable.title, `%${query}%`),
                    ilike(quizzesTable.description, `%${query}%`)
                  )
                )
              );

            for (const quiz of quizzes) {
              results.push({
                type: "quiz",
                id: quiz.id,
                title: quiz.title,
                description: quiz.description,
              });
            }
          }
        }

        logger.info("searchCourseContent executed", {
          query,
          courseId: context.courseId,
          resultsCount: results.length,
        });

        return {
          results,
          query,
          totalFound: results.length,
          searchedIn: types,
        };
      },
    }),

    getTranscript: tool({
      description:
        "Get the transcript of the current video. Use this when the student asks about specific content in the video.",
      inputSchema: getTranscriptSchema,
      execute: async ({ aroundTimestamp }) => {
        if (context.itemType !== "video") {
          return {
            available: false,
            reason: "Current item is not a video",
          };
        }

        if (!context.transcript) {
          return {
            available: false,
            reason: "Transcript not available for this video",
            suggestion:
              "The video has not been analyzed yet. You can still help with general questions.",
          };
        }

        logger.info("getTranscript executed", {
          itemId: context.itemId,
          hasTimestamp: !!aroundTimestamp,
        });

        return {
          available: true,
          transcript: context.transcript,
          currentTime: aroundTimestamp ?? context.currentTime,
          note:
            "This is the full transcript. The student is currently at " +
            formatTimestamp(context.currentTime),
        };
      },
    }),
  };
}

export type LearnAssistantTools = ReturnType<typeof createLearnAssistantTools>;
