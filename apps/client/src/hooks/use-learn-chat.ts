import { useCallback, useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { getTenantFromHost, getResolvedSlug } from "@/lib/tenant";
import { ensureValidToken } from "@/lib/http";
import { i18n } from "@/i18n";

export type ChatAttachment = {
  type: "image";
  data: string;
  mimeType: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  attachments?: ChatAttachment[];
};

export type ToolInvocation = {
  id: string;
  toolName: string;
  args: Record<string, unknown>;
  state: "pending" | "completed" | "error";
  result?: unknown;
  timestamp: number;
};

export type LearnChatContext = {
  courseId: string;
  itemId: string;
  currentTime: number;
};

type ChatStatus = "idle" | "streaming" | "error";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function useLearnChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [toolInvocations, setToolInvocations] = useState<ToolInvocation[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const contextRef = useRef<LearnChatContext | null>(null);
  const prevItemIdRef = useRef<string | null>(null);

  messagesRef.current = messages;

  const setContext = useCallback((context: LearnChatContext) => {
    if (prevItemIdRef.current && prevItemIdRef.current !== context.itemId) {
      setMessages([]);
      setToolInvocations([]);
      setError(null);
    }
    prevItemIdRef.current = context.itemId;
    contextRef.current = context;
  }, []);

  const updateCurrentTime = useCallback((time: number) => {
    if (contextRef.current) {
      contextRef.current.currentTime = time;
    }
  }, []);

  const sendMessage = useCallback(
    async (content: string, files?: File[], contextFiles?: File[]) => {
      if (!contextRef.current) {
        toast.error(i18n.t("learn.aiChat.contextError"));
        return;
      }

      const processedAttachments: ChatAttachment[] | undefined = files?.length
        ? await Promise.all(
            files.map(async (file) => ({
              type: "image" as const,
              data: await fileToBase64(file),
              mimeType: file.type,
            }))
          )
        : undefined;

      const processedContextFiles: ChatAttachment[] | undefined =
        contextFiles?.length
          ? await Promise.all(
              contextFiles.map(async (file) => ({
                type: "image" as const,
                data: await fileToBase64(file),
                mimeType: file.type,
              }))
            )
          : undefined;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: Date.now(),
        attachments: processedAttachments,
      };

      setMessages((prev) => [...prev, userMessage]);
      setStatus("streaming");
      setError(null);
      setToolInvocations([]);

      const allAttachments = [
        ...(processedContextFiles || []),
        ...(processedAttachments || []),
      ];

      const allMessages = [...messagesRef.current, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments,
      }));

      const lastMessageIndex = allMessages.length - 1;
      if (allAttachments.length > 0) {
        allMessages[lastMessageIndex].attachments = allAttachments;
      }

      const token = await ensureValidToken();
      const { slug } = getTenantFromHost();
      const tenantSlug = slug || getResolvedSlug();

      if (!token) {
        setStatus("error");
        setError("No authentication token found");
        toast.error(i18n.t("common.errors.unauthorized"));
        return;
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      if (tenantSlug) {
        headers["X-Tenant-Slug"] = tenantSlug;
      }

      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/ai/learn/chat`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              messages: allMessages,
              context: contextRef.current,
            }),
            signal: abortControllerRef.current.signal,
          }
        );

        if (response.status === 401) {
          setStatus("error");
          setError("Session expired");
          toast.error(i18n.t("common.errors.sessionExpired"));
          return;
        }

        if (response.status === 403) {
          setStatus("error");
          setError("Not enrolled in course");
          toast.error(i18n.t("learn.aiChat.notEnrolled"));
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let currentMessageId: string | null = null;
        let currentMessageContent = "";
        let hasSeenToolCalls = false;

        const createNewAssistantMessage = () => {
          const newMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "",
            timestamp: Date.now(),
          };
          currentMessageId = newMessage.id;
          currentMessageContent = "";
          setMessages((prev) => [...prev, newMessage]);
          return newMessage.id;
        };

        const updateCurrentMessage = (content: string) => {
          if (!currentMessageId) return;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === currentMessageId ? { ...m, content } : m
            )
          );
        };

        const processSSELine = (line: string) => {
          if (!line.startsWith("data: ")) return;

          const data = line.slice(6);
          if (data === "[DONE]") return;

          try {
            const event = JSON.parse(data);

            switch (event.type) {
              case "text-delta":
                if (hasSeenToolCalls && !currentMessageId) {
                  createNewAssistantMessage();
                } else if (!currentMessageId) {
                  createNewAssistantMessage();
                }
                currentMessageContent += event.delta;
                updateCurrentMessage(currentMessageContent);
                break;

              case "tool-input-available":
                hasSeenToolCalls = true;
                currentMessageId = null;
                currentMessageContent = "";
                setToolInvocations((prev) => [
                  ...prev,
                  {
                    id: event.toolCallId,
                    toolName: event.toolName,
                    args: event.input || {},
                    state: "pending",
                    timestamp: Date.now(),
                  },
                ]);
                break;

              case "tool-output-available": {
                setToolInvocations((prev) =>
                  prev.map((t) =>
                    t.id === event.toolCallId
                      ? { ...t, state: "completed", result: event.output }
                      : t
                  )
                );
                break;
              }
            }
          } catch (err) {
            console.warn("SSE parse error:", { line, error: err });
          }
        };

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            if (buffer.trim()) {
              processSSELine(buffer);
            }
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            processSSELine(line);
          }
        }

        setStatus("idle");
        setToolInvocations([]);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          setStatus("idle");
          return;
        }

        const isNetworkError =
          err instanceof Error &&
          (err.message.includes("fetch") ||
            err.message.includes("network") ||
            err.message.includes("Failed to fetch"));

        setStatus("error");
        const errorMsg = isNetworkError
          ? i18n.t("learn.aiChat.networkError")
          : i18n.t("learn.aiChat.error");

        toast.error(errorMsg);
        setError(errorMsg);

        setMessages((prev) => {
          return prev.filter(
            (m) => m.role !== "assistant" || m.content.trim() !== ""
          );
        });
      } finally {
        abortControllerRef.current = null;
      }
    },
    []
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus("idle");
  }, []);

  const reset = useCallback(() => {
    setMessages([]);
    setStatus("idle");
    setError(null);
    setToolInvocations([]);
  }, []);

  return {
    messages,
    status,
    isStreaming: status === "streaming",
    error,
    toolInvocations,
    sendMessage,
    cancel,
    reset,
    setContext,
    updateCurrentTime,
  };
}
