import { ensureValidToken } from "@/lib/http";
import { UploadsService } from "@/services/uploads/service";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

export type ChatAttachment = {
  type: "image";
  key: string;
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

export type OnboardingPhase = "creation" | "personalization" | "completed";

type ChatStatus = "idle" | "streaming" | "error";

const STORAGE_KEY = "onboarding_chat_state";

type PersistedState = {
  messages: ChatMessage[];
  tenantId: string | null;
  phase: OnboardingPhase;
};

function loadPersistedState(): PersistedState | null {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

function savePersistedState(state: PersistedState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

function clearPersistedState() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

async function uploadImageToS3(file: File): Promise<string> {
  const { uploadUrl, key } = await UploadsService.getPresignedUrl({
    folder: "onboarding-temp",
    fileName: file.name,
    contentType: file.type,
  });

  await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });

  return key;
}

export function useOnboardingChat() {
  const persistedState = loadPersistedState();

  const [messages, setMessages] = useState<ChatMessage[]>(
    persistedState?.messages || []
  );
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [toolInvocations, setToolInvocations] = useState<ToolInvocation[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(
    persistedState?.tenantId || null
  );
  const [phase, setPhase] = useState<OnboardingPhase>(
    persistedState?.phase || "creation"
  );
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  const messagesRef = useRef<ChatMessage[]>(messages);
  const abortControllerRef = useRef<AbortController | null>(null);
  const tenantIdRef = useRef<string | null>(tenantId);

  messagesRef.current = messages;
  tenantIdRef.current = tenantId;

  const persistState = useCallback(
    (newMessages?: ChatMessage[], newTenantId?: string | null, newPhase?: OnboardingPhase) => {
      savePersistedState({
        messages: newMessages ?? messagesRef.current,
        tenantId: newTenantId ?? tenantIdRef.current,
        phase: newPhase ?? phase,
      });
    },
    [phase]
  );

  const sendMessage = useCallback(
    async (content: string, files?: File[]) => {
      const processedAttachments: ChatAttachment[] | undefined = files?.length
        ? await Promise.all(
            files.filter((f) => f.type.startsWith("image/")).map(async (f) => ({
              type: "image" as const,
              key: await uploadImageToS3(f),
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

      const newMessages = [...messagesRef.current, userMessage];
      setMessages(newMessages);
      setStatus("streaming");
      setError(null);
      setToolInvocations([]);

      const allMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments,
      }));

      const token = await ensureValidToken();

      if (!token) {
        setStatus("error");
        setError("No authentication token found");
        toast.error("Session expired. Please log in again.");
        return;
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/ai/onboarding/chat`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              messages: allMessages,
              tenantId: tenantIdRef.current,
            }),
            signal: abortControllerRef.current.signal,
          }
        );

        if (response.status === 401) {
          setStatus("error");
          setError("Session expired");
          toast.error("Session expired. Please log in again.");
          return;
        }

        if (response.status === 403) {
          setStatus("error");
          setError("Access denied");
          toast.error("Access denied. Only owners can use onboarding.");
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

        const updateCurrentMessage = (messageContent: string) => {
          if (!currentMessageId) return;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === currentMessageId ? { ...m, content: messageContent } : m
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
                const toolResult = event.output;
                setToolInvocations((prev) =>
                  prev.map((t) =>
                    t.id === event.toolCallId
                      ? { ...t, state: "completed", result: toolResult }
                      : t
                  )
                );

                if (event.toolName === "createTenant" && toolResult?.success) {
                  const newTenantId = toolResult.tenant?.id;
                  if (newTenantId) {
                    setTenantId(newTenantId);
                    tenantIdRef.current = newTenantId;
                    setPhase("personalization");
                    persistState(undefined, newTenantId, "personalization");
                  }
                }

                if (event.toolName === "skipPersonalization" && toolResult?.success) {
                  if (toolResult.redirectTo) {
                    setRedirectTo(toolResult.redirectTo);
                    setPhase("completed");
                    clearPersistedState();
                  }
                }
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

        setMessages((prev) => {
          persistState(prev);
          return prev;
        });
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          setStatus("idle");
          return;
        }

        setStatus("error");
        toast.error("Something went wrong. Please try again.");
        setError("An error occurred");

        setMessages((prev) => {
          return prev.filter(
            (m) => m.role !== "assistant" || m.content.trim() !== ""
          );
        });
      } finally {
        abortControllerRef.current = null;
      }
    },
    [persistState]
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
    setTenantId(null);
    setPhase("creation");
    setRedirectTo(null);
    clearPersistedState();
  }, []);

  const completeOnboarding = useCallback((slug: string) => {
    setRedirectTo(`/${slug}`);
    setPhase("completed");
    clearPersistedState();
  }, []);

  return {
    messages,
    status,
    isStreaming: status === "streaming",
    error,
    toolInvocations,
    tenantId,
    phase,
    redirectTo,
    sendMessage,
    cancel,
    reset,
    completeOnboarding,
  };
}
