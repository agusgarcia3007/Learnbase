import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, RotateCcw, Sparkles, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import { MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";
import { Loader } from "@/components/ai-elements/loader";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { CoursePreviewCard } from "./course-preview-card";
import { useAICourseChat, type ChatMessage, type ToolInvocation } from "@/hooks/use-ai-course-chat";
import { useVideosList } from "@/services/videos";
import { useDocumentsList } from "@/services/documents";
import { useQuizzesList } from "@/services/quizzes";
import { cn } from "@/lib/utils";

type TimelineItem =
  | { type: "message"; data: ChatMessage }
  | { type: "tool"; data: ToolInvocation };

const TOOL_LABELS: Record<string, string> = {
  searchVideos: "Buscando videos",
  searchDocuments: "Buscando documentos",
  searchQuizzes: "Buscando quizzes",
  createQuiz: "Creando quiz",
  createModule: "Creando módulo",
  generateCoursePreview: "Generando vista previa",
  createCourse: "Creando curso",
};

function getToolState(invocation: ToolInvocation): "input-available" | "output-available" | "output-error" {
  if (invocation.state === "pending") return "input-available";
  if (invocation.state === "error") return "output-error";
  return "output-available";
}

function UserBubble({ content, index }: { content: string; index: number }) {
  return (
    <div
      className="flex w-full justify-end animate-in fade-in-0 slide-in-from-right-2"
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: "backwards" }}
    >
      <div className="flex items-end gap-2 max-w-[85%]">
        <div className="rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
          <p className="whitespace-pre-wrap">{content}</p>
        </div>
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary">
          <User className="size-3.5 text-primary-foreground" />
        </div>
      </div>
    </div>
  );
}

function AssistantBubble({ content, index }: { content: string; index: number }) {
  return (
    <div
      className="flex w-full animate-in fade-in-0 slide-in-from-left-2"
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: "backwards" }}
    >
      <div className="flex items-end gap-2 max-w-[85%]">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
          <Sparkles className="size-3.5 text-muted-foreground" />
        </div>
        <div className="rounded-2xl rounded-bl-md border border-border bg-card px-4 py-2.5 text-sm">
          <MessageResponse className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            {content}
          </MessageResponse>
        </div>
      </div>
    </div>
  );
}

function ToolCard({ invocation, index }: { invocation: ToolInvocation; index: number }) {
  return (
    <div
      className="ml-9 animate-in fade-in-0 slide-in-from-bottom-1"
      style={{ animationDelay: `${index * 50 + 100}ms`, animationFillMode: "backwards" }}
    >
      <Tool className="border-border/50 bg-muted/30 shadow-sm">
        <ToolHeader
          title={TOOL_LABELS[invocation.toolName] || invocation.toolName}
          type="tool-invocation"
          state={getToolState(invocation)}
        />
        <ToolContent>
          <ToolInput input={invocation.args} />
          {invocation.state === "completed" && invocation.result && (
            <ToolOutput output={invocation.result} errorText={undefined} />
          )}
        </ToolContent>
      </Tool>
    </div>
  );
}

function LoadingBubble() {
  return (
    <div className="flex w-full animate-in fade-in-0 slide-in-from-left-2">
      <div className="flex items-end gap-2">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
          <Sparkles className="size-3.5 text-muted-foreground animate-pulse" />
        </div>
        <div className="rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3">
          <Loader />
        </div>
      </div>
    </div>
  );
}

export function AICourseCreator() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const { data: videosData } = useVideosList({ limit: 10, status: "published" });
  const { data: documentsData } = useDocumentsList({ limit: 10, status: "published" });
  const { data: quizzesData } = useQuizzesList({ limit: 10, status: "published" });

  const {
    messages,
    isStreaming,
    coursePreview,
    toolInvocations,
    sendMessage,
    reset,
    clearPreview,
  } = useAICourseChat();

  const timeline = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [
      ...messages.map((m) => ({ type: "message" as const, data: m })),
      ...toolInvocations.map((t) => ({ type: "tool" as const, data: t })),
    ];
    return items.sort((a, b) => a.data.timestamp - b.data.timestamp);
  }, [messages, toolInvocations]);

  const handleSendMessage = async (message: { text: string }) => {
    if (!message.text.trim()) return;
    await sendMessage(message.text);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleConfirmCourse = () => {
    if (coursePreview) {
      clearPreview();
      sendMessage(t("courses.aiCreator.confirmMessage"));
    }
  };

  const handleReset = () => {
    reset();
  };

  const suggestions = useMemo(() => {
    const result: string[] = [];

    const videos = videosData?.videos ?? [];
    const documents = documentsData?.documents ?? [];
    const quizzes = quizzesData?.quizzes ?? [];

    if (videos.length > 0) {
      const video = videos[Math.floor(Math.random() * Math.min(videos.length, 5))];
      result.push(t("courses.aiCreator.suggestions.withVideo", { title: video.title }));
    }

    if (documents.length > 0) {
      const doc = documents[Math.floor(Math.random() * Math.min(documents.length, 5))];
      result.push(t("courses.aiCreator.suggestions.withDocument", { title: doc.title }));
    }

    if (videos.length >= 3) {
      result.push(t("courses.aiCreator.suggestions.multipleVideos", { count: videos.length }));
    }

    if (quizzes.length > 0 && videos.length > 0) {
      result.push(t("courses.aiCreator.suggestions.withQuiz"));
    }

    if (result.length === 0) {
      result.push(t("courses.aiCreator.suggestions.empty"));
    }

    return result.slice(0, 3);
  }, [videosData, documentsData, quizzesData, t]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button className="gap-2">
          <Sparkles className="size-4" />
          {t("courses.aiCreator.toggle")}
          <ChevronDown
            className={cn(
              "size-4 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-4 overflow-hidden rounded-lg border bg-card data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <div className="flex h-[400px] flex-col">
          {messages.length === 0 && !coursePreview ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-5 p-6">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
                <Sparkles className="size-7 text-muted-foreground" />
              </div>
              <div className="text-center space-y-1.5">
                <h3 className="text-lg font-semibold tracking-tight">
                  {t("courses.aiCreator.emptyTitle")}
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {t("courses.aiCreator.emptyDescription")}
                </p>
              </div>
              <Suggestions className="mt-1 flex-wrap justify-center">
                {suggestions.map((suggestion, index) => (
                  <Suggestion
                    key={suggestion}
                    suggestion={suggestion}
                    onClick={handleSuggestionClick}
                    className="animate-in fade-in-0 slide-in-from-bottom-2"
                    style={{ animationDelay: `${index * 100}ms`, animationFillMode: "backwards" }}
                  />
                ))}
              </Suggestions>
            </div>
          ) : (
            <Conversation className="flex-1">
              <ConversationContent className="gap-4 p-4">
                {timeline.map((item, index) =>
                  item.type === "message" ? (
                    item.data.role === "user" ? (
                      <UserBubble
                        key={item.data.id}
                        content={item.data.content}
                        index={index}
                      />
                    ) : (
                      <AssistantBubble
                        key={item.data.id}
                        content={item.data.content}
                        index={index}
                      />
                    )
                  ) : (
                    <ToolCard
                      key={item.data.id}
                      invocation={item.data}
                      index={index}
                    />
                  )
                )}
                {isStreaming && messages[messages.length - 1]?.role !== "assistant" && toolInvocations.length === 0 && (
                  <LoadingBubble />
                )}
                {coursePreview && (
                  <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                    <CoursePreviewCard
                      preview={coursePreview}
                      onConfirm={handleConfirmCourse}
                      onEdit={clearPreview}
                    />
                  </div>
                )}
              </ConversationContent>
            </Conversation>
          )}

          <div className="border-t bg-muted/50 p-3">
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleReset}
                  disabled={isStreaming}
                  title={t("courses.aiCreator.reset")}
                >
                  <RotateCcw className="size-4" />
                </Button>
              )}
              <PromptInput
                onSubmit={handleSendMessage}
                className="flex-1 rounded-xl border-border bg-background focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20"
              >
                <PromptInputTextarea
                  placeholder={t("courses.aiCreator.placeholder")}
                  disabled={isStreaming}
                  className="min-h-10 resize-none bg-transparent"
                />
                <PromptInputFooter>
                  <div />
                  <PromptInputSubmit
                    disabled={isStreaming}
                    status={isStreaming ? "streaming" : undefined}
                  />
                </PromptInputFooter>
              </PromptInput>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
