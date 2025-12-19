import { useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, ChevronRight, ImagePlus, CheckCircle } from "lucide-react";
import { Button } from "@learnbase/ui";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
  PromptInputAttachments,
  PromptInputAttachment,
  PromptInputButton,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageAttachments,
  MessageAttachment,
} from "@/components/ai-elements/message";
import { Loader } from "@/components/ai-elements/loader";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarToggleTab,
  useRightSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useLearnChat } from "@/hooks/use-learn-chat";

type AIChatSidebarProps = {
  courseId: string;
  courseTitle: string;
  itemId: string;
  itemTitle: string;
  itemType: "video" | "document" | "quiz";
  currentTime: number;
  videoElement?: HTMLVideoElement | null;
  documentUrl?: string | null;
  documentFileName?: string | null;
  documentMimeType?: string | null;
  assistantName?: string;
};


function dataURLToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  const u8arr = new Uint8Array(bstr.length);
  for (let i = 0; i < bstr.length; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }
  return new Blob([u8arr], { type: mime });
}

function dataURLToFile(
  dataUrl: string,
  filename: string,
  mimeType: string
): File {
  const blob = dataURLToBlob(dataUrl);
  return new File([blob], filename, { type: mimeType || blob.type });
}

function captureVideoFrame(videoElement: HTMLVideoElement): File | null {
  const canvas = document.createElement("canvas");
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(videoElement, 0, 0);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  const blob = dataURLToBlob(dataUrl);
  return new File([blob], `frame-${Date.now()}.jpg`, { type: "image/jpeg" });
}

async function fetchDocumentAsFile(
  url: string,
  fileName: string,
  mimeType: string
): Promise<File | null> {
  const response = await fetch(url);
  if (!response.ok) return null;
  const blob = await response.blob();
  return new File([blob], fileName, { type: mimeType || blob.type });
}

export function AIChatSidebar({
  courseId,
  courseTitle: _courseTitle,
  itemId,
  itemTitle,
  itemType,
  currentTime,
  videoElement,
  documentUrl,
  documentFileName,
  documentMimeType,
  assistantName,
}: AIChatSidebarProps) {
  const { t } = useTranslation();
  const { toggle, isMobile } = useRightSidebar();
  const {
    messages,
    isStreaming,
    toolInvocations,
    sendMessage,
    cancel,
    reset,
    setContext,
    updateCurrentTime,
  } = useLearnChat();

  const prevItemIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setContext({
      courseId,
      itemId,
      currentTime,
    });
  }, [courseId, itemId, setContext, currentTime]);

  useEffect(() => {
    updateCurrentTime(currentTime);
  }, [currentTime, updateCurrentTime]);

  useEffect(() => {
    if (prevItemIdRef.current && prevItemIdRef.current !== itemId) {
      reset();
    }
    prevItemIdRef.current = itemId;
  }, [itemId, reset]);

  const handleSubmit = useCallback(
    async ({ text, files }: PromptInputMessage) => {
      if (!text.trim() && !files?.length) return;

      let contextFiles: File[] | undefined;

      if (itemType === "video" && videoElement) {
        const frame = captureVideoFrame(videoElement);
        if (frame) {
          contextFiles = [frame];
        }
      } else if (
        itemType === "document" &&
        documentUrl &&
        documentFileName &&
        documentMimeType
      ) {
        const docFile = await fetchDocumentAsFile(
          documentUrl,
          documentFileName,
          documentMimeType
        );
        if (docFile) {
          contextFiles = [docFile];
        }
      }

      const userFiles: File[] | undefined = files?.length
        ? files
            .filter((f) => f.url)
            .map((f) =>
              dataURLToFile(
                f.url,
                f.filename || `attachment-${Date.now()}`,
                f.mediaType || "application/octet-stream"
              )
            )
        : undefined;

      await sendMessage(text, userFiles, contextFiles);
    },
    [
      sendMessage,
      itemType,
      videoElement,
      documentUrl,
      documentFileName,
      documentMimeType,
    ]
  );

  const handleOpenFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const initialMessage =
    messages.length === 0
      ? t("learn.aiChat.initialMessage", { itemTitle })
      : null;

  return (
    <>
      <Sidebar variant="floating" side="right" collapsible="offcanvas">
        <SidebarHeader className="from-primary/5 to-primary/10 border-b bg-gradient-to-r">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Sparkles className="text-primary size-5" />
                {isStreaming && (
                  <span className="bg-primary absolute -top-0.5 -right-0.5 size-2 animate-pulse rounded-full" />
                )}
              </div>
              <span className="whitespace-nowrap font-semibold">
                {assistantName || t("learn.aiAssistant")}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className={cn("size-7", isMobile && "hidden")}
              onClick={toggle}
              aria-label={t("learn.closeAIChat")}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </SidebarHeader>

        <SidebarContent className="flex flex-col">
          <Conversation className="flex-1">
            <ConversationContent className="gap-4">
              {initialMessage && (
                <Message from="assistant">
                  <MessageContent>
                    <MessageResponse>{initialMessage}</MessageResponse>
                  </MessageContent>
                </Message>
              )}

              {messages.map((message) => (
                <Message key={message.id} from={message.role}>
                  {message.attachments && message.attachments.length > 0 && (
                    <MessageAttachments>
                      {message.attachments.map((att, i) => (
                        <MessageAttachment
                          key={i}
                          data={
                            att.type === "image"
                              ? {
                                  type: "file",
                                  url: `https://cdn.uselearnbase.com/${att.key}`,
                                  mediaType: "image/jpeg",
                                }
                              : {
                                  type: "file",
                                  url: att.data,
                                  mediaType: att.mimeType,
                                }
                          }
                        />
                      ))}
                    </MessageAttachments>
                  )}
                  <MessageContent>
                    <MessageResponse>{message.content}</MessageResponse>
                  </MessageContent>
                </Message>
              ))}

              {toolInvocations.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {toolInvocations.every((t) => t.state === "completed") ? (
                    <CheckCircle className="size-3 text-green-600" />
                  ) : (
                    <Loader size={12} />
                  )}
                  <span>
                    {toolInvocations.every((t) => t.state === "completed")
                      ? `Used ${toolInvocations.length} resource${toolInvocations.length > 1 ? "s" : ""}`
                      : `Using ${toolInvocations.length} resource${toolInvocations.length > 1 ? "s" : ""}...`}
                  </span>
                </div>
              )}

              {isStreaming && toolInvocations.length === 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader size={16} />
                  <span className="text-sm">{t("learn.aiChat.thinking")}</span>
                </div>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        </SidebarContent>

        <SidebarFooter className="border-t">
          <PromptInput
            onSubmit={handleSubmit}
            accept="image/*"
            multiple
            maxFiles={3}
          >
            <PromptInputAttachments>
              {(file) => <PromptInputAttachment data={file} />}
            </PromptInputAttachments>
            <PromptInputTextarea
              placeholder={t("learn.aiChatPlaceholder")}
              className="min-h-12"
              disabled={isStreaming}
            />
            <PromptInputFooter>
              <PromptInputTools>
                <PromptInputButton
                  type="button"
                  onClick={handleOpenFileDialog}
                  disabled={isStreaming}
                  aria-label={t("learn.aiChat.attachImage")}
                >
                  <ImagePlus className="size-4" />
                </PromptInputButton>
              </PromptInputTools>
              <PromptInputSubmit
                status={isStreaming ? "streaming" : undefined}
                onClick={isStreaming ? cancel : undefined}
              />
            </PromptInputFooter>
          </PromptInput>
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
