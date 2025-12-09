import { useCallback, useState } from "react";
import { getTenantFromHost, getResolvedSlug } from "@/lib/tenant";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
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
  modules: CoursePreviewModule[];
};

export type ToolInvocation = {
  id: string;
  toolName: string;
  args: Record<string, unknown>;
  state: "pending" | "completed" | "error";
  result?: unknown;
};

type ChatStatus = "idle" | "streaming" | "error";

export function useAICourseChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [coursePreview, setCoursePreview] = useState<CoursePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toolInvocations, setToolInvocations] = useState<ToolInvocation[]>([]);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setStatus("streaming");
    setError(null);
    setToolInvocations([]);

    const allMessages = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const token = localStorage.getItem("accessToken");
    const { slug } = getTenantFromHost();
    const tenantSlug = slug || getResolvedSlug();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (tenantSlug) {
      headers["X-Tenant-Slug"] = tenantSlug;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/ai/courses/chat`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ messages: allMessages }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let assistantContent = "";
      let buffer = "";

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
      };

      setMessages((prev) => [...prev, assistantMessage]);

      const updateAssistantMessage = (newContent: string) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id ? { ...m, content: newContent } : m
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
              assistantContent += event.delta;
              updateAssistantMessage(assistantContent);
              break;

            case "tool-input-available":
              setToolInvocations((prev) => [
                ...prev,
                {
                  id: event.toolCallId,
                  toolName: event.toolName,
                  args: event.input || {},
                  state: "pending",
                },
              ]);
              break;

            case "tool-output-available":
              setToolInvocations((prev) =>
                prev.map((t) =>
                  t.id === event.toolCallId
                    ? { ...t, state: "completed", result: event.output }
                    : t
                )
              );

              if (
                event.toolName === "generateCoursePreview" &&
                event.output?.type === "course_preview"
              ) {
                const { type: _, ...preview } = event.output;
                setCoursePreview(preview as CoursePreview);
              }
              break;
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
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unknown error");

      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.role === "assistant" && !lastMessage.content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    }
  }, [messages]);

  const reset = useCallback(() => {
    setMessages([]);
    setStatus("idle");
    setCoursePreview(null);
    setError(null);
    setToolInvocations([]);
  }, []);

  const clearPreview = useCallback(() => {
    setCoursePreview(null);
  }, []);

  return {
    messages,
    status,
    isStreaming: status === "streaming",
    coursePreview,
    error,
    toolInvocations,
    sendMessage,
    reset,
    clearPreview,
  };
}
