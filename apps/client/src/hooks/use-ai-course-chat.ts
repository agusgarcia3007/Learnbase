import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getTenantFromHost, getResolvedSlug } from "@/lib/tenant";
import { ensureValidToken } from "@/lib/http";
import { QUERY_KEYS as COURSES_QUERY_KEYS } from "@/services/courses/service";
import { AIService } from "@/services/ai/service";
import { i18n } from "@/i18n";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

export type CoursePreviewModule = {
  id?: string;
  title: string;
  description?: string;
  items: Array<{
    type: "video" | "document" | "quiz";
    id: string;
    title: string;
  }>;
};

export type CoursePreview = {
  title: string;
  shortDescription: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  objectives: string[];
  requirements: string[];
  features: string[];
  categoryId?: string;
  categoryName?: string;
  modules: CoursePreviewModule[];
};

export type ToolInvocation = {
  id: string;
  toolName: string;
  args: Record<string, unknown>;
  state: "pending" | "completed" | "error";
  result?: unknown;
  timestamp: number;
};

type ChatStatus = "idle" | "streaming" | "error";

async function generateAndUploadThumbnail(courseId: string) {
  try {
    await AIService.generateCourseThumbnail(courseId);
  } catch (err) {
    console.warn("Failed to generate thumbnail:", err);
  }
}

export function useAICourseChat() {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [coursePreview, setCoursePreview] = useState<CoursePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toolInvocations, setToolInvocations] = useState<ToolInvocation[]>([]);
  const [courseCreated, setCourseCreated] = useState<{ courseId: string; title: string } | null>(null);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  messagesRef.current = messages;

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setStatus("streaming");
    setError(null);
    setToolInvocations([]);

    const allMessages = [...messagesRef.current, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

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
      "Authorization": `Bearer ${token}`,
    };

    if (tenantSlug) {
      headers["X-Tenant-Slug"] = tenantSlug;
    }

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/ai/courses/chat`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ messages: allMessages }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (response.status === 401) {
        setStatus("error");
        setError("Session expired");
        toast.error(i18n.t("common.errors.sessionExpired"));
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
              let matchedToolName: string | undefined;

              setToolInvocations((prev) => {
                const invocation = prev.find((t) => t.id === event.toolCallId);
                matchedToolName = invocation?.toolName;
                return prev.map((t) =>
                  t.id === event.toolCallId
                    ? { ...t, state: "completed", result: event.output }
                    : t
                );
              });

              if (
                matchedToolName === "generateCoursePreview" &&
                event.output?.type === "course_preview"
              ) {
                const { type: _, ...preview } = event.output;
                setCoursePreview(preview as CoursePreview);
              }

              if (
                matchedToolName === "createCourse" &&
                event.output?.type === "course_created"
              ) {
                const { courseId, title } = event.output;
                setCourseCreated({ courseId, title });
                setCoursePreview(null);
                queryClient.invalidateQueries({ queryKey: COURSES_QUERY_KEYS.COURSES });
                toast.success(i18n.t("courses.aiCreator.created"));

                setIsGeneratingThumbnail(true);
                generateAndUploadThumbnail(courseId).finally(() => {
                  setIsGeneratingThumbnail(false);
                  queryClient.invalidateQueries({ queryKey: COURSES_QUERY_KEYS.COURSES });
                });
              }
              break;
            }
          }
        } catch {
          // Ignore parse errors
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
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setStatus("idle");
        return;
      }

      setStatus("error");
      setError(err instanceof Error ? err.message : "Unknown error");

      setMessages((prev) => {
        return prev.filter((m) => m.role !== "assistant" || m.content.trim() !== "");
      });
    } finally {
      abortControllerRef.current = null;
    }
  }, [queryClient]);

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
    setCoursePreview(null);
    setCourseCreated(null);
    setError(null);
    setToolInvocations([]);
    setIsGeneratingThumbnail(false);
  }, []);

  const clearPreview = useCallback(() => {
    setCoursePreview(null);
  }, []);

  const createCourseFromPreview = useCallback(async (preview: CoursePreview) => {
    const token = await ensureValidToken();
    const { slug } = getTenantFromHost();
    const tenantSlug = slug || getResolvedSlug();

    if (!token) {
      toast.error(i18n.t("common.errors.unauthorized"));
      throw new Error("No authentication token");
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    };
    if (tenantSlug) headers["X-Tenant-Slug"] = tenantSlug;

    const response = await fetch(`${import.meta.env.VITE_API_URL}/ai/courses/create-from-preview`, {
      method: "POST",
      headers,
      body: JSON.stringify(preview),
    });

    if (!response.ok) {
      const errorText = await response.text();
      toast.error(i18n.t("courses.aiCreator.createError"));
      throw new Error(errorText || "Failed to create course");
    }

    const data = await response.json();
    const courseId = data.course.id;
    setCourseCreated({ courseId, title: data.course.title });
    setCoursePreview(null);
    queryClient.invalidateQueries({ queryKey: COURSES_QUERY_KEYS.COURSES });
    toast.success(i18n.t("courses.aiCreator.created"));

    setIsGeneratingThumbnail(true);
    generateAndUploadThumbnail(courseId).finally(() => {
      setIsGeneratingThumbnail(false);
      queryClient.invalidateQueries({ queryKey: COURSES_QUERY_KEYS.COURSES });
    });

    return data.course;
  }, [queryClient]);

  return {
    messages,
    status,
    isStreaming: status === "streaming",
    isGeneratingThumbnail,
    coursePreview,
    courseCreated,
    error,
    toolInvocations,
    sendMessage,
    cancel,
    reset,
    clearPreview,
    createCourseFromPreview,
  };
}
