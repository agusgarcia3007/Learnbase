import { Link, useParams } from "@tanstack/react-router";
import {
  BookOpen,
  Check,
  CheckCircle,
  ChevronDown,
  ImageIcon,
  Paperclip,
  RotateCcw,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  User,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import { CourseMentionPopover } from "@/components/ai-elements/course-mention-popover";
import { Loader } from "@/components/ai-elements/loader";
import { MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@learnbase/ui";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  useAICourseChat,
  type ChatAttachment,
  type ContextCourse,
  type ToolInvocation,
} from "@/hooks/use-ai-course-chat";
import {
  useCourseMention,
  type SelectedCourse,
} from "@/hooks/use-course-mention";
import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { siteData } from "@/lib/constants";
import { useSubmitFeedback, type FeedbackType } from "@/services/ai";
import { useDocumentsList } from "@/services/documents";
import { useGetProfile } from "@/services/profile/queries";
import { useQuizzesList } from "@/services/quizzes";
import { useVideosList } from "@/services/videos";
import { CoursePreviewCard } from "./course-preview-card";

type UserBubbleProps = {
  content: string;
  index: number;
  courses?: ContextCourse[];
  attachments?: ChatAttachment[];
  userAvatar?: string | null;
  userName?: string;
};

function UserBubble({
  content,
  index,
  courses,
  attachments,
  userAvatar,
  userName,
}: UserBubbleProps) {
  return (
    <div
      className="flex w-full justify-end animate-in fade-in-0 slide-in-from-right-2"
      style={{
        animationDelay: `${index * 50}ms`,
        animationFillMode: "backwards",
      }}
    >
      <div className="flex items-end gap-2 max-w-[85%]">
        <div className="rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
          {attachments && attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {attachments.map((att, i) => (
                <img
                  key={i}
                  src={`https://cdn.uselearnbase.com/${att.key}`}
                  alt="attachment"
                  className="max-w-[200px] max-h-[150px] rounded object-cover"
                />
              ))}
            </div>
          )}
          {courses && courses.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {courses.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1 rounded bg-primary-foreground/20 px-1.5 py-0.5 text-xs"
                >
                  <BookOpen className="size-3" />
                  <span className="truncate max-w-[100px]">{c.title}</span>
                </span>
              ))}
            </div>
          )}
          <p className="whitespace-pre-wrap">{content}</p>
        </div>
        <Avatar className="size-7 shrink-0">
          <AvatarImage src={userAvatar ?? undefined} alt={userName} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {userName ? getInitials(userName) : <User className="size-3.5" />}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}

function AssistantBubble({
  content,
  index,
  messageIndex,
  feedback,
  onFeedback,
}: {
  content: string;
  index: number;
  messageIndex: number;
  feedback?: FeedbackType | null;
  onFeedback?: (messageIndex: number, type: FeedbackType, content: string) => void;
}) {
  return (
    <div
      className="flex w-full animate-in fade-in-0 slide-in-from-left-2"
      style={{
        animationDelay: `${index * 50}ms`,
        animationFillMode: "backwards",
      }}
    >
      <div className="flex items-end gap-2 max-w-[85%]">
        <Avatar className="size-7 shrink-0">
          <AvatarImage src={siteData.logo} alt={siteData.name} />
          <AvatarFallback className="bg-muted">
            <Sparkles className="size-3.5 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <div className="group relative">
          <div className="rounded-2xl rounded-bl-md border border-border bg-card px-4 py-2.5 text-sm">
            <MessageResponse className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              {content}
            </MessageResponse>
          </div>
          <div className={cn(
            "absolute -bottom-5 left-8 flex items-center gap-0.5 transition-opacity",
            feedback ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}>
            <button
              type="button"
              onClick={() => onFeedback?.(messageIndex, "thumbs_up", content)}
              disabled={!!feedback}
              className={cn(
                "rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-default",
                feedback === "thumbs_up" && "text-green-600 hover:text-green-600"
              )}
              title="Me gusta"
            >
              <ThumbsUp className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onFeedback?.(messageIndex, "thumbs_down", content)}
              disabled={!!feedback}
              className={cn(
                "rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-default",
                feedback === "thumbs_down" && "text-red-600 hover:text-red-600"
              )}
              title="No me gusta"
            >
              <ThumbsDown className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolIndicator({
  toolInvocations,
}: {
  toolInvocations: ToolInvocation[];
}) {
  if (toolInvocations.length === 0) return null;

  const allCompleted = toolInvocations.every((t) => t.state === "completed");

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-9">
      {allCompleted ? (
        <CheckCircle className="size-3 text-green-600" />
      ) : (
        <Loader size={12} />
      )}
      <span>
        {allCompleted
          ? `Usó ${toolInvocations.length} herramienta${
              toolInvocations.length > 1 ? "s" : ""
            }`
          : `Usando ${toolInvocations.length} herramienta${
              toolInvocations.length > 1 ? "s" : ""
            }...`}
      </span>
    </div>
  );
}

function LoadingBubble() {
  return (
    <div className="flex w-full animate-in fade-in-0 slide-in-from-left-2">
      <div className="flex items-end gap-2">
        <Avatar className="size-7 shrink-0 animate-pulse">
          <AvatarImage src={siteData.logo} alt={siteData.name} />
          <AvatarFallback className="bg-muted">
            <Sparkles className="size-3.5 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <div className="rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3">
          <Loader />
        </div>
      </div>
    </div>
  );
}

function AttachmentButton({ disabled }: { disabled?: boolean }) {
  const attachments = usePromptInputAttachments();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-8"
      disabled={disabled}
      onClick={() => attachments.openFileDialog()}
      title="Adjuntar imagen"
    >
      <Paperclip className="size-4" />
    </Button>
  );
}

type AICourseCreatorProps = {
  generatingThumbnailCourseId?: string | null;
  onGeneratingThumbnailChange?: (courseId: string | null) => void;
};

export function AICourseCreator({
  onGeneratingThumbnailChange,
}: AICourseCreatorProps) {
  const { t } = useTranslation();
  const { tenantSlug } = useParams({ strict: false });
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedCourses, setSelectedCourses] = useState<SelectedCourse[]>([]);
  const [messageFeedback, setMessageFeedback] = useState<Record<number, FeedbackType>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { mutate: submitFeedback } = useSubmitFeedback();

  const { data: videosData } = useVideosList({
    limit: 10,
    status: "published",
  });
  const { data: documentsData } = useDocumentsList({
    limit: 10,
    status: "published",
  });
  const { data: quizzesData } = useQuizzesList({
    limit: 10,
    status: "published",
  });
  const { data: profileData } = useGetProfile();

  const {
    messages,
    isStreaming,
    isGeneratingThumbnail,
    coursePreview,
    courseCreated,
    toolInvocations,
    sendMessage,
    cancel,
    reset,
    clearPreview,
    createCourseFromPreview,
  } = useAICourseChat();

  const selectedCourseIds = useMemo(
    () => selectedCourses.map((c) => c.id),
    [selectedCourses]
  );

  const handleCourseSelect = useCallback((course: SelectedCourse) => {
    setSelectedCourses((prev) => [...prev, course]);
  }, []);

  const mention = useCourseMention({
    onSelect: handleCourseSelect,
    maxMentions: 3,
    selectedCourseIds,
  });

  const handleCourseRemove = useCallback((courseId: string) => {
    setSelectedCourses((prev) => prev.filter((c) => c.id !== courseId));
  }, []);

  useEffect(() => {
    if (onGeneratingThumbnailChange) {
      onGeneratingThumbnailChange(
        isGeneratingThumbnail && courseCreated ? courseCreated.courseId : null
      );
    }
  }, [isGeneratingThumbnail, courseCreated, onGeneratingThumbnailChange]);

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => a.timestamp - b.timestamp);
  }, [messages]);

  const handleSendMessage = async (message: {
    text: string;
    files?: { url?: string; mediaType?: string }[];
  }) => {
    if (!message.text.trim() && (!message.files || message.files.length === 0))
      return;

    const imageFiles: File[] = [];
    if (message.files?.length) {
      for (const file of message.files) {
        if (file.mediaType?.startsWith("image/") && file.url) {
          try {
            const response = await fetch(file.url);
            const blob = await response.blob();
            imageFiles.push(
              new File([blob], "image", { type: file.mediaType })
            );
          } catch (err) {
            console.warn("Failed to process attachment:", err);
          }
        }
      }
    }

    const coursesToSend: ContextCourse[] | undefined =
      selectedCourses.length > 0
        ? selectedCourses.map((c) => ({ id: c.id, title: c.title }))
        : undefined;

    sendMessage(
      message.text,
      imageFiles.length > 0 ? imageFiles : undefined,
      coursesToSend
    );
    setInputValue("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleConfirmCourse = async () => {
    if (!coursePreview || isCreating) return;
    setIsCreating(true);
    try {
      await createCourseFromPreview(coursePreview);
    } finally {
      setIsCreating(false);
    }
  };

  const handleReset = () => {
    reset();
    setInputValue("");
    setSelectedCourses([]);
    setMessageFeedback({});
    mention.close();
  };

  const handleFeedback = useCallback((messageIndex: number, type: FeedbackType, content: string) => {
    setMessageFeedback((prev) => ({ ...prev, [messageIndex]: type }));
    submitFeedback({
      type,
      messageIndex,
      originalContent: content,
    });
  }, [submitFeedback]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    mention.handleInputChange(newValue);
  };

  const handleTextareaKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    mention.handleKeyDown(e);
  };

  const handleMentionSelect = useCallback(
    (course: {
      id: string;
      title: string;
      level: string;
      modulesCount: number;
    }) => {
      mention.handleSelect(
        course as Parameters<typeof mention.handleSelect>[0]
      );
      setInputValue(mention.getCleanedInput(inputValue));
      textareaRef.current?.focus();
    },
    [mention, inputValue]
  );

  const suggestions = useMemo(() => {
    const result: string[] = [];

    const videos = videosData?.videos ?? [];
    const documents = documentsData?.documents ?? [];
    const quizzes = quizzesData?.quizzes ?? [];

    if (videos.length > 0) {
      const video =
        videos[Math.floor(Math.random() * Math.min(videos.length, 5))];
      result.push(
        t("courses.aiCreator.suggestions.withVideo", { title: video.title })
      );
    }

    if (documents.length > 0) {
      const doc =
        documents[Math.floor(Math.random() * Math.min(documents.length, 5))];
      result.push(
        t("courses.aiCreator.suggestions.withDocument", { title: doc.title })
      );
    }

    if (videos.length >= 3) {
      result.push(
        t("courses.aiCreator.suggestions.multipleVideos", {
          count: videos.length,
        })
      );
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
        <div className="flex h-[550px] flex-col">
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
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animationFillMode: "backwards",
                    }}
                  />
                ))}
              </Suggestions>
            </div>
          ) : (
            <Conversation className="flex-1">
              <ConversationContent className="gap-4 p-4">
                {sortedMessages.map((message, index) =>
                  message.role === "user" ? (
                    <UserBubble
                      key={message.id}
                      content={message.content}
                      index={index}
                      courses={message.contextCourses}
                      attachments={message.attachments}
                      userAvatar={profileData?.user.avatar}
                      userName={profileData?.user.name}
                    />
                  ) : (
                    <AssistantBubble
                      key={message.id}
                      content={message.content}
                      index={index}
                      messageIndex={index}
                      feedback={messageFeedback[index]}
                      onFeedback={handleFeedback}
                    />
                  )
                )}
                <ToolIndicator toolInvocations={toolInvocations} />
                {isStreaming &&
                  toolInvocations.length === 0 &&
                  !coursePreview && <LoadingBubble />}
                {coursePreview && (
                  <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                    <CoursePreviewCard
                      preview={coursePreview}
                      onConfirm={handleConfirmCourse}
                      onEdit={clearPreview}
                      isCreating={isCreating}
                    />
                  </div>
                )}
                {courseCreated && (
                  <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 ml-9">
                    <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 p-4">
                      <div className="flex gap-4">
                        {isGeneratingThumbnail ? (
                          <div className="relative w-32 shrink-0 aspect-video rounded-md bg-green-100 dark:bg-green-900 overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <ImageIcon className="size-6 text-green-400 dark:text-green-600" />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-200/50 dark:via-green-700/50 to-transparent animate-shimmer" />
                          </div>
                        ) : null}
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                              <Check className="size-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <h4 className="font-medium text-green-900 dark:text-green-100">
                                {t("courses.aiCreator.successTitle")}
                              </h4>
                              <p className="text-sm text-green-700 dark:text-green-300">
                                "{courseCreated.title}"
                              </p>
                              {isGeneratingThumbnail && (
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                  {t("courses.aiCreator.generatingThumbnail")}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleReset}
                            >
                              {t("courses.aiCreator.createAnother")}
                            </Button>
                            <Button size="sm" asChild>
                              <Link
                                to="/$tenantSlug/content/courses"
                                params={{ tenantSlug: tenantSlug! }}
                                search={{
                                  page: 1,
                                  limit: 10,
                                  sort: undefined,
                                  search: undefined,
                                  status: undefined,
                                  level: undefined,
                                  categoryIds: undefined,
                                  edit: courseCreated.courseId,
                                }}
                              >
                                {t("courses.aiCreator.viewCourse")}
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
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
              <div className="relative flex-1">
                <CourseMentionPopover
                  open={mention.isOpen}
                  searchQuery={mention.searchQuery}
                  onSelect={handleMentionSelect}
                  excludeIds={selectedCourseIds}
                />
                <PromptInput
                  onSubmit={handleSendMessage}
                  accept="image/*"
                  maxFiles={1}
                  maxFileSize={5 * 1024 * 1024}
                  className="rounded-xl border-border bg-background focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20"
                >
                  <PromptInputAttachments>
                    {(file) => <PromptInputAttachment data={file} />}
                  </PromptInputAttachments>
                  {selectedCourses.length > 0 && (
                    <div
                      data-align="block-start"
                      className="flex w-full flex-wrap justify-start gap-1.5 px-3 pt-2 pb-1"
                    >
                      {selectedCourses.map((course) => (
                        <span
                          key={course.id}
                          className="inline-flex items-center gap-1 rounded border border-primary/20 bg-primary/5 px-1.5 py-0.5 text-xs font-medium text-primary"
                        >
                          <BookOpen className="size-3" />
                          <span className="max-w-[120px] truncate">
                            {course.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCourseRemove(course.id)}
                            disabled={isStreaming}
                            className="opacity-60 hover:opacity-100 disabled:pointer-events-none"
                          >
                            <X className="size-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <PromptInputTextarea
                    ref={textareaRef}
                    placeholder={t("courses.aiCreator.placeholder")}
                    disabled={isStreaming}
                    className="min-h-10 resize-none bg-transparent"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleTextareaKeyDown}
                  />
                  <PromptInputFooter>
                    <div className="flex-1" />
                    <AttachmentButton disabled={isStreaming} />
                    <PromptInputSubmit
                      status={isStreaming ? "streaming" : undefined}
                      onClick={isStreaming ? cancel : undefined}
                      type={isStreaming ? "button" : "submit"}
                    />
                  </PromptInputFooter>
                </PromptInput>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
