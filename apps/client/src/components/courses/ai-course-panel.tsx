import { Link, useParams } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Check,
  CheckCircle,
  ChevronRight,
  ImageIcon,
  MessageSquarePlus,
  Paperclip,
  RotateCcw,
  Send,
  Sparkles,
  User,
  X,
  Zap,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarToggleTab,
  useRightSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { siteData } from "@/lib/constants";
import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useDocumentsList } from "@/services/documents";
import { useGetProfile } from "@/services/profile/queries";
import { useQuizzesList } from "@/services/quizzes";
import { useVideosList } from "@/services/videos";
import { CoursePreviewCard } from "./course-preview-card";

type UserBubbleProps = {
  content: string;
  courses?: ContextCourse[];
  attachments?: ChatAttachment[];
  userAvatar?: string | null;
  userName?: string;
};

function UserBubble({
  content,
  courses,
  attachments,
  userAvatar,
  userName,
}: UserBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex w-full justify-end"
    >
      <div className="flex items-end gap-2 max-w-[90%]">
        <div className="rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
          {attachments && attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {attachments.map((att, i) => (
                <img
                  key={i}
                  src={`https://cdn.uselearnbase.com/${att.key}`}
                  alt="attachment"
                  className="max-w-[160px] max-h-[100px] rounded-lg object-cover"
                />
              ))}
            </div>
          )}
          {courses && courses.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {courses.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs"
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
    </motion.div>
  );
}

function AssistantBubble({ content }: { content: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex w-full"
    >
      <div className="flex items-end gap-2 max-w-[90%]">
        <Avatar className="size-7 shrink-0">
          <AvatarImage src={siteData.logo} alt={siteData.name} />
          <AvatarFallback className="bg-muted">
            <Sparkles className="size-3.5 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <div className="rounded-2xl rounded-bl-sm border bg-card px-4 py-2.5 text-sm">
          <MessageResponse className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            {content}
          </MessageResponse>
        </div>
      </div>
    </motion.div>
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1.5 ml-9 text-xs text-muted-foreground"
    >
      {allCompleted ? (
        <CheckCircle className="size-3.5 text-green-600" />
      ) : (
        <Loader size={12} />
      )}
      <span>
        {allCompleted
          ? `${toolInvocations.length} herramienta${toolInvocations.length > 1 ? "s" : ""} completada${toolInvocations.length > 1 ? "s" : ""}`
          : `Usando ${toolInvocations.length} herramienta${toolInvocations.length > 1 ? "s" : ""}...`}
      </span>
    </motion.div>
  );
}

function LoadingBubble() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex w-full"
    >
      <div className="flex items-end gap-2">
        <Avatar className="size-7 shrink-0 animate-pulse">
          <AvatarImage src={siteData.logo} alt={siteData.name} />
          <AvatarFallback className="bg-muted">
            <Sparkles className="size-3.5 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <div className="rounded-2xl rounded-bl-sm border bg-card px-4 py-3">
          <Loader />
        </div>
      </div>
    </motion.div>
  );
}

function AttachmentButton({ disabled }: { disabled?: boolean }) {
  const attachments = usePromptInputAttachments();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          disabled={disabled}
          onClick={() => attachments.openFileDialog()}
        >
          <Paperclip className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Adjuntar imagen</TooltipContent>
    </Tooltip>
  );
}

function EmptyState({
  suggestions,
  onSuggestionClick,
}: {
  suggestions: string[];
  onSuggestionClick: (s: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 p-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex size-14 items-center justify-center rounded-2xl bg-muted"
      >
        <Sparkles className="size-7 text-muted-foreground" />
      </motion.div>

      <motion.div
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="text-center space-y-1.5"
      >
        <h3 className="text-lg font-semibold tracking-tight">
          {t("courses.aiCreator.emptyTitle")}
        </h3>
        <p className="text-sm text-muted-foreground max-w-[260px]">
          {t("courses.aiCreator.emptyDescription")}
        </p>
      </motion.div>

      <Suggestions className="mt-1 flex-col items-stretch gap-2 w-full max-w-[280px]">
        {suggestions.map((suggestion, index) => (
          <motion.div
            key={suggestion}
            initial={{ x: -12, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 + index * 0.05 }}
          >
            <Suggestion
              suggestion={suggestion}
              onClick={onSuggestionClick}
              className="w-full justify-start text-left px-3 py-2.5 h-auto whitespace-normal rounded-xl border bg-card hover:bg-accent transition-colors group"
            >
              <Zap className="size-3 shrink-0 text-primary opacity-0 group-hover:opacity-100 transition-opacity mr-2" />
              <span className="text-left">{suggestion}</span>
            </Suggestion>
          </motion.div>
        ))}
      </Suggestions>
    </div>
  );
}

function SuccessBanner({
  courseCreated,
  isGeneratingThumbnail,
  tenantSlug,
  onReset,
}: {
  courseCreated: { courseId: string; title: string };
  isGeneratingThumbnail: boolean;
  tenantSlug: string;
  onReset: () => void;
}) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="ml-9"
    >
      <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 p-4">
        <div className="flex gap-4">
          {isGeneratingThumbnail && (
            <div className="relative w-24 shrink-0 aspect-video rounded-lg bg-green-100 dark:bg-green-900 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <ImageIcon className="size-5 text-green-400" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-200/50 dark:via-green-800/30 to-transparent animate-shimmer" />
            </div>
          )}

          <div className="flex-1 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <Check className="size-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-medium text-green-900 dark:text-green-100">
                  {t("courses.aiCreator.successTitle")}
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  "{courseCreated.title}"
                </p>
                {isGeneratingThumbnail && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <Loader size={10} />
                    {t("courses.aiCreator.generatingThumbnail")}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onReset}>
                <MessageSquarePlus className="size-3.5 mr-1.5" />
                {t("courses.aiCreator.createAnother")}
              </Button>
              <Button size="sm" asChild>
                <Link
                  to="/$tenantSlug/content/courses"
                  params={{ tenantSlug }}
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
    </motion.div>
  );
}

type AICourseCreatorProps = {
  onGeneratingThumbnailChange?: (courseId: string | null) => void;
};

export function AICoursePanel({
  onGeneratingThumbnailChange,
}: AICourseCreatorProps) {
  const { t } = useTranslation();
  const { tenantSlug } = useParams({ strict: false });
  const { open: _open, toggle, isMobile } = useRightSidebar();
  const [isCreating, setIsCreating] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedCourses, setSelectedCourses] = useState<SelectedCourse[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, coursePreview, courseCreated]);

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
          const response = await fetch(file.url);
          const blob = await response.blob();
          imageFiles.push(new File([blob], "image", { type: file.mediaType }));
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
    mention.close();
  };

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
    <>
      <Sidebar variant="floating" side="right" collapsible="offcanvas">
        <SidebarHeader className="border-b bg-sidebar px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="size-4.5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-sm">
                  {t("courses.aiCreator.toggle")}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {t("courses.aiCreator.emptyDescription")}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className={cn("size-8", isMobile && "hidden")}
              onClick={toggle}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </SidebarHeader>

        <SidebarContent className="flex flex-col">
          {messages.length === 0 && !coursePreview ? (
            <EmptyState
              suggestions={suggestions}
              onSuggestionClick={handleSuggestionClick}
            />
          ) : (
            <ScrollArea className="h-full w-full" ref={scrollRef}>
              <Conversation className="h-full">
                <ConversationContent className="gap-4 p-4 w-full max-w-full">
                  <AnimatePresence mode="popLayout">
                    {sortedMessages.map((message) =>
                      message.role === "user" ? (
                        <UserBubble
                          key={message.id}
                          content={message.content}
                          courses={message.contextCourses}
                          attachments={message.attachments}
                          userAvatar={profileData?.user.avatar}
                          userName={profileData?.user.name}
                        />
                      ) : (
                        <AssistantBubble
                          key={message.id}
                          content={message.content}
                        />
                      )
                    )}
                  </AnimatePresence>

                  <ToolIndicator toolInvocations={toolInvocations} />

                  {isStreaming &&
                    toolInvocations.length === 0 &&
                    !coursePreview && <LoadingBubble />}

                  {coursePreview && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="ml-9 max-w-full overflow-hidden"
                    >
                      <CoursePreviewCard
                        preview={coursePreview}
                        onConfirm={handleConfirmCourse}
                        onEdit={clearPreview}
                        isCreating={isCreating}
                      />
                    </motion.div>
                  )}

                  {courseCreated && (
                    <SuccessBanner
                      courseCreated={courseCreated}
                      isGeneratingThumbnail={isGeneratingThumbnail}
                      tenantSlug={tenantSlug!}
                      onReset={handleReset}
                    />
                  )}
                </ConversationContent>
              </Conversation>
            </ScrollArea>
          )}
        </SidebarContent>

        <SidebarFooter className="border-t bg-sidebar p-3">
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleReset}
                    disabled={isStreaming}
                    className="size-8"
                  >
                    <RotateCcw className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("courses.aiCreator.reset")}</TooltipContent>
              </Tooltip>
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
                className="rounded-xl border bg-background focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20"
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
                      <motion.span
                        key={course.id}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary"
                      >
                        <BookOpen className="size-3" />
                        <span className="max-w-[100px] truncate">
                          {course.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCourseRemove(course.id)}
                          disabled={isStreaming}
                          className="opacity-60 hover:opacity-100 disabled:pointer-events-none transition-opacity"
                        >
                          <X className="size-2.5" />
                        </button>
                      </motion.span>
                    ))}
                  </div>
                )}

                <PromptInputTextarea
                  ref={textareaRef}
                  placeholder={t("courses.aiCreator.placeholder")}
                  disabled={isStreaming}
                  className="min-h-10 resize-none bg-transparent text-sm"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleTextareaKeyDown}
                />

                <PromptInputFooter className="border-t-0 pt-1">
                  <div className="flex-1" />
                  <AttachmentButton disabled={isStreaming} />
                  <PromptInputSubmit
                    status={isStreaming ? "streaming" : undefined}
                    onClick={isStreaming ? cancel : undefined}
                    type={isStreaming ? "button" : "submit"}
                    className={cn(!isStreaming && "bg-primary hover:bg-primary/90")}
                  >
                    {!isStreaming && <Send className="size-4" />}
                  </PromptInputSubmit>
                </PromptInputFooter>
              </PromptInput>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarToggleTab
        side="right"
        icon={<Sparkles className="text-primary size-4" />}
        label="AI"
        showOnMobile
      />
    </>
  );
}
