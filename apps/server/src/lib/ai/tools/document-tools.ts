import { tool, generateText } from "ai";
import { db } from "@/db";
import {
  videosTable,
  documentsTable,
  moduleItemsTable,
  modulesTable,
  tenantsTable,
} from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { generateEmbedding } from "../embeddings";
import { transcribeVideo } from "../transcript";
import { groq } from "../groq";
import { AI_MODELS } from "../models";
import { getPresignedUrl } from "@/lib/upload";
import { s3 } from "@/lib/s3";
import {
  generateDocumentFromVideoSchema,
  generateDocumentFromModuleSchema,
} from "./schemas";
import type { ToolContext } from "./utils";
import {
  buildDocumentPrompt,
  buildModuleDocumentPrompt,
  DOCUMENT_TYPES,
  type DocumentType,
} from "../prompts-document";
import {
  generatePdfFromContent,
  parseDocumentResponse,
  type DocumentSourceInfo,
} from "../pdf-generation";

export function createDocumentTools(ctx: ToolContext) {
  const { tenantId, userId } = ctx;

  return {
    generateDocumentFromVideo: tool({
      description:
        "Generate a PDF study document from a video's transcript. Use this when user wants notes, summary, or study materials from a video. The transcript is used as the ONLY source - no external information is added. Document types: study_notes (default, bullet points with key takeaways), summary (concise overview), formatted_transcript (organized sections), outline (hierarchical structure), key_concepts (glossary).",
      inputSchema: generateDocumentFromVideoSchema,
      execute: async ({
        videoId,
        documentType = "study_notes",
        title,
        moduleId,
      }) => {
        logger.info("generateDocumentFromVideo started", {
          videoId,
          documentType,
          moduleId,
        });

        const [video] = await db
          .select({
            id: videosTable.id,
            title: videosTable.title,
            videoKey: videosTable.videoKey,
            transcript: videosTable.transcript,
            duration: videosTable.duration,
          })
          .from(videosTable)
          .where(
            and(eq(videosTable.id, videoId), eq(videosTable.tenantId, tenantId))
          )
          .limit(1);

        if (!video) {
          return { type: "error" as const, error: "Video not found" };
        }

        let transcript = video.transcript;

        if (!transcript) {
          if (!video.videoKey) {
            return {
              type: "error" as const,
              error: "Video has no file uploaded and no transcript available",
            };
          }

          const videoUrl = getPresignedUrl(video.videoKey);
          logger.info("Transcribing video for document generation", {
            videoId: video.id,
          });
          transcript = await transcribeVideo(videoUrl);

          await db
            .update(videosTable)
            .set({ transcript })
            .where(eq(videosTable.id, video.id));
        }

        if (transcript.length < 100) {
          return {
            type: "error" as const,
            error: "Transcript is too short to generate a meaningful document",
          };
        }

        const prompt = buildDocumentPrompt(
          documentType as DocumentType,
          transcript,
          video.title
        );

        logger.info("Generating document content with AI", {
          videoId,
          documentType,
          transcriptLength: transcript.length,
        });

        const { text: responseText } = await generateText({
          model: groq(AI_MODELS.CONTENT_ANALYSIS),
          prompt,
          maxOutputTokens: 8000,
          temperature: 0.3,
        });

        if (!responseText) {
          return {
            type: "error" as const,
            error: "Failed to generate document content from AI",
          };
        }

        let documentStructure;
        try {
          documentStructure = parseDocumentResponse(responseText);
        } catch (parseError) {
          logger.error("Failed to parse document response", {
            error: parseError,
            response: responseText.substring(0, 500),
          });
          return {
            type: "error" as const,
            error: "Failed to parse AI response into document structure",
          };
        }

        const [tenant] = await db
          .select({
            name: tenantsTable.name,
            customTheme: tenantsTable.customTheme,
          })
          .from(tenantsTable)
          .where(eq(tenantsTable.id, tenantId))
          .limit(1);

        const sourceInfo: DocumentSourceInfo = {
          videoTitles: [video.title],
          totalDuration: video.duration ?? undefined,
          generatedAt: new Date(),
          documentType: documentType as DocumentType,
        };

        const pdfBuffer = await generatePdfFromContent({
          document: {
            title: title || documentStructure.title,
            sections: documentStructure.sections,
          },
          sourceInfo,
          tenantName: tenant?.name || "LearnBase",
          theme: tenant?.customTheme,
        });

        const timestamp = Date.now();
        const fileKey = `documents/${tenantId}/${userId}/${timestamp}.pdf`;
        const documentTitle =
          title || `${video.title} - ${DOCUMENT_TYPES[documentType as DocumentType]}`;
        const fileName = `${documentTitle}.pdf`;

        await s3.write(fileKey, pdfBuffer, { type: "application/pdf" });

        const [document] = await db
          .insert(documentsTable)
          .values({
            tenantId,
            title: documentTitle,
            description: `Auto-generated ${DOCUMENT_TYPES[documentType as DocumentType].toLowerCase()} from video: ${video.title}`,
            fileKey,
            fileName,
            fileSize: pdfBuffer.byteLength,
            mimeType: "application/pdf",
            status: "published",
          })
          .returning();

        const embedding = await generateEmbedding(documentTitle);
        await db
          .update(documentsTable)
          .set({ embedding })
          .where(eq(documentsTable.id, document.id));

        let addedToModule = false;

        if (moduleId) {
          const [maxOrder] = await db
            .select({ maxOrder: moduleItemsTable.order })
            .from(moduleItemsTable)
            .where(eq(moduleItemsTable.moduleId, moduleId))
            .orderBy(desc(moduleItemsTable.order))
            .limit(1);

          await db.insert(moduleItemsTable).values({
            moduleId,
            contentType: "document",
            contentId: document.id,
            order: (maxOrder?.maxOrder ?? -1) + 1,
            isPreview: false,
          });

          addedToModule = true;
          logger.info("Document added to module", {
            documentId: document.id,
            moduleId,
          });
        }

        logger.info("generateDocumentFromVideo completed", {
          documentId: document.id,
          title: document.title,
          fileSize: pdfBuffer.byteLength,
          addedToModule,
        });

        return {
          type: "document_generated" as const,
          documentId: document.id,
          title: document.title,
          documentType,
          fileSize: pdfBuffer.byteLength,
          addedToModule,
          moduleId: addedToModule ? moduleId : undefined,
        };
      },
    }),

    generateDocumentFromModule: tool({
      description:
        "Generate a comprehensive PDF document from all videos in a module. Combines transcripts from multiple videos into a single cohesive document. Use this when user wants study materials covering an entire module or section. Only uses content from the actual video transcripts - no external information is added.",
      inputSchema: generateDocumentFromModuleSchema,
      execute: async ({
        moduleId,
        documentType = "study_notes",
        title,
        addToModule = true,
      }) => {
        logger.info("generateDocumentFromModule started", {
          moduleId,
          documentType,
          addToModule,
        });

        const [module] = await db
          .select({
            id: modulesTable.id,
            title: modulesTable.title,
          })
          .from(modulesTable)
          .where(
            and(
              eq(modulesTable.id, moduleId),
              eq(modulesTable.tenantId, tenantId)
            )
          )
          .limit(1);

        if (!module) {
          return { type: "error" as const, error: "Module not found" };
        }

        const moduleItems = await db
          .select({
            contentId: moduleItemsTable.contentId,
            order: moduleItemsTable.order,
          })
          .from(moduleItemsTable)
          .where(
            and(
              eq(moduleItemsTable.moduleId, moduleId),
              eq(moduleItemsTable.contentType, "video")
            )
          )
          .orderBy(moduleItemsTable.order);

        if (moduleItems.length === 0) {
          return {
            type: "error" as const,
            error: "Module has no videos to generate document from",
          };
        }

        const videoIds = moduleItems.map((item) => item.contentId);

        const videos = await db
          .select({
            id: videosTable.id,
            title: videosTable.title,
            videoKey: videosTable.videoKey,
            transcript: videosTable.transcript,
            duration: videosTable.duration,
          })
          .from(videosTable)
          .where(
            and(
              inArray(videosTable.id, videoIds),
              eq(videosTable.tenantId, tenantId)
            )
          );

        const videoMap = new Map(videos.map((v) => [v.id, v]));
        const orderedVideos = moduleItems
          .map((item) => videoMap.get(item.contentId))
          .filter(Boolean) as typeof videos;

        const videosWithTranscripts: Array<{
          title: string;
          transcript: string;
          duration: number | null;
        }> = [];

        for (const video of orderedVideos) {
          let transcript = video.transcript;

          if (!transcript && video.videoKey) {
            const videoUrl = getPresignedUrl(video.videoKey);
            logger.info("Transcribing video for module document", {
              videoId: video.id,
            });
            transcript = await transcribeVideo(videoUrl);

            await db
              .update(videosTable)
              .set({ transcript })
              .where(eq(videosTable.id, video.id));
          }

          if (transcript && transcript.length >= 50) {
            videosWithTranscripts.push({
              title: video.title,
              transcript,
              duration: video.duration,
            });
          }
        }

        if (videosWithTranscripts.length === 0) {
          return {
            type: "error" as const,
            error: "No videos with sufficient transcript content found in module",
          };
        }

        const prompt = buildModuleDocumentPrompt(
          documentType as DocumentType,
          videosWithTranscripts,
          module.title
        );

        logger.info("Generating module document content with AI", {
          moduleId,
          documentType,
          videoCount: videosWithTranscripts.length,
        });

        const { text: responseText } = await generateText({
          model: groq(AI_MODELS.CONTENT_ANALYSIS),
          prompt,
          maxOutputTokens: 8000,
          temperature: 0.3,
        });

        if (!responseText) {
          return {
            type: "error" as const,
            error: "Failed to generate document content from AI",
          };
        }

        let documentStructure;
        try {
          documentStructure = parseDocumentResponse(responseText);
        } catch (parseError) {
          logger.error("Failed to parse module document response", {
            error: parseError,
            response: responseText.substring(0, 500),
          });
          return {
            type: "error" as const,
            error: "Failed to parse AI response into document structure",
          };
        }

        const [tenant] = await db
          .select({
            name: tenantsTable.name,
            customTheme: tenantsTable.customTheme,
          })
          .from(tenantsTable)
          .where(eq(tenantsTable.id, tenantId))
          .limit(1);

        const totalDuration = videosWithTranscripts.reduce(
          (sum, v) => sum + (v.duration || 0),
          0
        );

        const sourceInfo: DocumentSourceInfo = {
          videoTitles: videosWithTranscripts.map((v) => v.title),
          totalDuration: totalDuration || undefined,
          generatedAt: new Date(),
          documentType: documentType as DocumentType,
        };

        const pdfBuffer = await generatePdfFromContent({
          document: {
            title: title || documentStructure.title,
            sections: documentStructure.sections,
          },
          sourceInfo,
          tenantName: tenant?.name || "LearnBase",
          theme: tenant?.customTheme,
        });

        const timestamp = Date.now();
        const fileKey = `documents/${tenantId}/${userId}/${timestamp}.pdf`;
        const documentTitle =
          title || `${module.title} - ${DOCUMENT_TYPES[documentType as DocumentType]}`;
        const fileName = `${documentTitle}.pdf`;

        await s3.write(fileKey, pdfBuffer, { type: "application/pdf" });

        const [document] = await db
          .insert(documentsTable)
          .values({
            tenantId,
            title: documentTitle,
            description: `Auto-generated ${DOCUMENT_TYPES[documentType as DocumentType].toLowerCase()} from module: ${module.title} (${videosWithTranscripts.length} videos)`,
            fileKey,
            fileName,
            fileSize: pdfBuffer.byteLength,
            mimeType: "application/pdf",
            status: "published",
          })
          .returning();

        const embedding = await generateEmbedding(documentTitle);
        await db
          .update(documentsTable)
          .set({ embedding })
          .where(eq(documentsTable.id, document.id));

        let addedToModuleResult = false;

        if (addToModule) {
          const [maxOrder] = await db
            .select({ maxOrder: moduleItemsTable.order })
            .from(moduleItemsTable)
            .where(eq(moduleItemsTable.moduleId, moduleId))
            .orderBy(desc(moduleItemsTable.order))
            .limit(1);

          await db.insert(moduleItemsTable).values({
            moduleId,
            contentType: "document",
            contentId: document.id,
            order: (maxOrder?.maxOrder ?? -1) + 1,
            isPreview: false,
          });

          addedToModuleResult = true;
          logger.info("Module document added to module", {
            documentId: document.id,
            moduleId,
          });
        }

        logger.info("generateDocumentFromModule completed", {
          documentId: document.id,
          title: document.title,
          fileSize: pdfBuffer.byteLength,
          videosProcessed: videosWithTranscripts.length,
          addedToModule: addedToModuleResult,
        });

        return {
          type: "document_generated" as const,
          documentId: document.id,
          title: document.title,
          documentType,
          fileSize: pdfBuffer.byteLength,
          videosProcessed: videosWithTranscripts.length,
          addedToModule: addedToModuleResult,
          moduleId: addedToModuleResult ? moduleId : undefined,
        };
      },
    }),
  };
}
