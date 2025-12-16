import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { AppError, ErrorCode } from "@/lib/errors";
import { streamText } from "ai";
import { aiGateway } from "@/lib/ai/gateway";
import { AI_MODELS } from "@/lib/ai/models";
import { ONBOARDING_CHAT_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { createOnboardingTools } from "@/lib/ai/tools/onboarding-tools";
import { logger } from "@/lib/logger";

export const chatOnboardingRoutes = new Elysia({ name: "ai-chat-onboarding" })
  .use(authPlugin)
  .post(
    "/onboarding/chat",
    async (ctx) => {
      if (!ctx.user) {
        throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
      }

      if (ctx.userRole !== "owner") {
        throw new AppError(
          ErrorCode.FORBIDDEN,
          "Only owners can use onboarding chat",
          403
        );
      }

      const userId = ctx.user.id;
      const { messages, tenantId } = ctx.body;

      logger.info("Starting onboarding chat", {
        userId,
        messageCount: messages.length,
        hasTenantId: !!tenantId,
      });

      let currentTenantId = tenantId || ctx.user.tenantId;

      const tools = createOnboardingTools({
        userId,
        tenantId: currentTenantId,
        setTenantId: (id: string) => {
          currentTenantId = id;
        },
      });

      const formattedMessages = messages.map((m) => {
        if (m.role === "user" && m.attachments?.length) {
          const attachmentInfo = m.attachments
            .map((att) => `[Uploaded image: ${att.key}]`)
            .join("\n");
          return {
            role: "user" as const,
            content: `${m.content}\n\n${attachmentInfo}`,
          };
        }
        return {
          role: m.role as "user" | "assistant",
          content: m.content,
        };
      });

      const result = streamText({
        model: aiGateway(AI_MODELS.COURSE_CHAT),
        system: ONBOARDING_CHAT_SYSTEM_PROMPT,
        messages: formattedMessages,
        tools,
        stopWhen: (event) => {
          return event.steps.length >= 10;
        },
        onStepFinish: (step) => {
          logger.info("Onboarding chat step finished", {
            userId,
            toolCalls: step.toolCalls?.length ?? 0,
            toolNames: step.toolCalls?.map((tc) => tc.toolName) ?? [],
          });
        },
        experimental_telemetry: {
          isEnabled: true,
          functionId: "onboarding-chat",
          metadata: {
            userId,
            tenantId: currentTenantId || "none",
          },
        },
      });

      return result.toUIMessageStreamResponse();
    },
    {
      body: t.Object({
        messages: t.Array(
          t.Object({
            role: t.Union([t.Literal("user"), t.Literal("assistant")]),
            content: t.String(),
            attachments: t.Optional(
              t.Array(
                t.Object({
                  type: t.Literal("image"),
                  key: t.String(),
                })
              )
            ),
          })
        ),
        tenantId: t.Optional(t.String({ format: "uuid" })),
      }),
      detail: {
        tags: ["AI"],
        summary: "Conversational AI onboarding for new tenant setup",
      },
    }
  );
