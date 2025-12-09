import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, RotateCcw, Sparkles } from "lucide-react";

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
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
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
import { useAICourseChat, type CoursePreview, type ToolInvocation } from "@/hooks/use-ai-course-chat";
import { useVideosList } from "@/services/videos";
import { useDocumentsList } from "@/services/documents";
import { useQuizzesList } from "@/services/quizzes";
import { cn } from "@/lib/utils";

type AICourseCreatorProps = {
  onCreateCourse: (preview: CoursePreview) => void;
};

const TOOL_LABELS: Record<string, string> = {
  searchVideos: "Buscando videos",
  searchDocuments: "Buscando documentos",
  searchQuizzes: "Buscando quizzes",
  createQuiz: "Creando quiz",
  createModule: "Creando módulo",
  generateCoursePreview: "Generando vista previa",
};

function getToolState(invocation: ToolInvocation): "input-available" | "output-available" | "output-error" {
  if (invocation.state === "pending") return "input-available";
  if (invocation.state === "error") return "output-error";
  return "output-available";
}

export function AICourseCreator({ onCreateCourse }: AICourseCreatorProps) {
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

  const handleSendMessage = async (message: { text: string }) => {
    if (!message.text.trim()) return;
    await sendMessage(message.text);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleConfirmCourse = () => {
    if (coursePreview) {
      onCreateCourse(coursePreview);
      reset();
      setIsOpen(false);
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
        <Button className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0">
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
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="size-6 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold">
                  {t("courses.aiCreator.emptyTitle")}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("courses.aiCreator.emptyDescription")}
                </p>
              </div>
              <Suggestions className="mt-2">
                {suggestions.map((suggestion) => (
                  <Suggestion
                    key={suggestion}
                    suggestion={suggestion}
                    onClick={handleSuggestionClick}
                  />
                ))}
              </Suggestions>
            </div>
          ) : (
            <Conversation className="flex-1">
              <ConversationContent className="p-4">
                {messages.map((message) => (
                  <Message key={message.id} from={message.role}>
                    <MessageContent>
                      {message.role === "assistant" ? (
                        <MessageResponse>{message.content}</MessageResponse>
                      ) : (
                        message.content
                      )}
                    </MessageContent>
                  </Message>
                ))}
                {toolInvocations.length > 0 && (
                  <div className="space-y-2">
                    {toolInvocations.map((invocation) => (
                      <Tool key={invocation.id}>
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
                    ))}
                  </div>
                )}
                {isStreaming && messages[messages.length - 1]?.role !== "assistant" && toolInvocations.length === 0 && (
                  <Message from="assistant">
                    <MessageContent>
                      <Loader />
                    </MessageContent>
                  </Message>
                )}
                {coursePreview && (
                  <CoursePreviewCard
                    preview={coursePreview}
                    onConfirm={handleConfirmCourse}
                    onEdit={clearPreview}
                  />
                )}
              </ConversationContent>
            </Conversation>
          )}

          <div className="border-t p-3">
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
                className="flex-1"
              >
                <PromptInputTextarea
                  placeholder={t("courses.aiCreator.placeholder")}
                  disabled={isStreaming}
                  className="min-h-10 resize-none"
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
