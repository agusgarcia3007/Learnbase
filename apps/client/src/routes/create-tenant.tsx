import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { useOnboardingChat } from "@/hooks/use-onboarding-chat";
import { createSeoMeta } from "@/lib/seo";
import { profileOptions } from "@/services/profile/options";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2Icon,
  Loader2Icon,
  MessageSquareIcon,
  SendIcon,
  SparklesIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/create-tenant")({
  ssr: false,
  head: () =>
    createSeoMeta({
      title: "Create Your Academy",
      description: "Set up your learning platform with AI assistance",
      noindex: true,
    }),
  beforeLoad: async ({ context }) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      throw redirect({ to: "/login" });
    }

    const data = await context.queryClient.ensureQueryData(profileOptions());

    if (!data?.user) {
      throw redirect({ to: "/login" });
    }

    if (data.user.role !== "owner" || data.user.tenantId !== null) {
      throw redirect({ to: "/", search: { campus: undefined } });
    }

    return { user: data.user };
  },
  component: CreateTenantPage,
});

function CreateTenantPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialMessageSent = useRef(false);

  const {
    messages,
    isStreaming,
    toolInvocations,
    sendMessage,
    redirectTo,
    phase,
    tenantId,
    completeOnboarding,
  } = useOnboardingChat();

  useEffect(() => {
    if (redirectTo) {
      navigate({ to: redirectTo });
    }
  }, [redirectTo, navigate]);

  useEffect(() => {
    if (!initialMessageSent.current && messages.length === 0) {
      initialMessageSent.current = true;
      sendMessage("Hola");
    }
  }, [messages.length, sendMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    sendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleContinuePersonalizing = () => {
    sendMessage(t("onboarding.continuePersonalizing"));
  };

  const handleExploreOnOwn = () => {
    if (tenantId) {
      sendMessage(t("onboarding.exploreOnOwn"));
    }
  };

  const showPhaseTransition =
    phase === "personalization" &&
    tenantId &&
    messages.length > 0 &&
    !isStreaming &&
    messages[messages.length - 1]?.role === "assistant" &&
    messages[messages.length - 1]?.content.includes("learnbase.com");

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2">
          <SparklesIcon className="size-5 text-primary" />
          <span className="font-semibold">{t("onboarding.title")}</span>
        </div>
      </header>

      <Conversation className="flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl px-4 py-6">
          {messages.length === 0 && !isStreaming ? (
            <ConversationEmptyState
              icon={<MessageSquareIcon className="size-12" />}
              title={t("onboarding.emptyState.title")}
              description={t("onboarding.emptyState.description")}
            />
          ) : (
            <>
              {messages.map((message) => (
                <Message key={message.id} from={message.role}>
                  <MessageContent>
                    <MessageResponse>{message.content}</MessageResponse>
                  </MessageContent>
                </Message>
              ))}

              {isStreaming && toolInvocations.length > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  {toolInvocations.map((tool) => (
                    <div key={tool.id} className="flex items-center gap-1.5">
                      {tool.state === "pending" ? (
                        <Loader2Icon className="size-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2Icon className="size-3.5 text-green-500" />
                      )}
                      <span>
                        {tool.toolName === "validateSlug" &&
                          t("onboarding.tools.validatingSlug")}
                        {tool.toolName === "createTenant" &&
                          t("onboarding.tools.creatingAcademy")}
                        {tool.toolName === "updateTenantSettings" &&
                          t("onboarding.tools.updatingSettings")}
                        {tool.toolName === "uploadLogo" &&
                          t("onboarding.tools.uploadingLogo")}
                        {tool.toolName === "skipPersonalization" &&
                          t("onboarding.tools.redirecting")}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {isStreaming && messages[messages.length - 1]?.role === "user" && (
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="size-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                    <span className="size-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                    <span className="size-2 animate-bounce rounded-full bg-primary" />
                  </div>
                </div>
              )}
            </>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {showPhaseTransition && (
        <div className="mx-auto w-full max-w-3xl px-4 pb-4">
          <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm sm:flex-row">
            <Button
              onClick={handleContinuePersonalizing}
              className="flex-1"
              disabled={isStreaming}
            >
              {t("onboarding.continuePersonalizing")}
            </Button>
            <Button
              onClick={handleExploreOnOwn}
              variant="outline"
              className="flex-1"
              disabled={isStreaming}
            >
              {t("onboarding.exploreOnOwn")}
            </Button>
          </div>
        </div>
      )}

      <div className="shrink-0 border-t bg-background p-4">
        <form
          onSubmit={handleSubmit}
          className="mx-auto w-full max-w-3xl"
        >
          <InputGroup>
            <InputGroupTextarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("onboarding.inputPlaceholder")}
              disabled={isStreaming}
              className="min-h-12 resize-none"
              rows={1}
            />
            <InputGroupButton type="submit" disabled={!input.trim() || isStreaming}>
              {isStreaming ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <SendIcon className="size-4" />
              )}
              <span className="sr-only">{t("onboarding.send")}</span>
            </InputGroupButton>
          </InputGroup>
        </form>
      </div>
    </div>
  );
}
