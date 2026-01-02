import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import {
  MessageSquare,
  Eye,
  BarChart3,
  Sparkles,
  User,
  Calendar,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import type { FilterFieldConfig } from "@/components/ui/filters";
import { getAssetUrl } from "@/lib/constants";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataGridColumnHeader } from "@/components/ui/data-grid";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

import { DataTable } from "@/components/data-table";
import { MessageResponse } from "@/components/ai-elements/message";
import { createSeoMeta } from "@/lib/seo";
import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useDataTableState } from "@/hooks/use-data-table-state";
import {
  useAdminConversationsList,
  useAdminConversationsAnalytics,
  useAdminConversation,
  type AdminConversation,
  type AdminConversationMessage,
} from "@/services/ai-conversations-admin";

export const Route = createFileRoute("/$tenantSlug/ai/conversations")({
  head: () =>
    createSeoMeta({
      title: "Student Conversations",
      description: "Monitor student AI conversations",
      noindex: true,
    }),
  component: ConversationsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    limit: Number(search.limit) || 10,
    sort: (search.sort as string) || undefined,
    search: (search.search as string) || undefined,
  }),
});

function AnalyticsCards() {
  const { t } = useTranslation();
  const { data, isLoading } = useAdminConversationsAnalytics();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="mt-1 h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            {t("conversations.admin.analytics.totalConversations")}
          </CardTitle>
          <MessageSquare className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalConversations}</div>
          <p className="text-xs text-muted-foreground">
            {t("conversations.admin.analytics.last30Days")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            {t("conversations.admin.analytics.totalMessages")}
          </CardTitle>
          <BarChart3 className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalMessages}</div>
          <p className="text-xs text-muted-foreground">
            {t("conversations.admin.analytics.last30Days")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function MessageBubble({
  message,
  userAvatar,
  userName,
}: {
  message: AdminConversationMessage;
  userAvatar?: string | null;
  userName?: string;
}) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn("flex w-full gap-3", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <Avatar className="size-8 shrink-0">
          <AvatarFallback className="bg-muted">
            <Sparkles className="size-4 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5",
          isUser
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm border bg-card"
        )}
      >
        {message.attachments && message.attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {message.attachments.map((att, i) =>
              att.type === "image" ? (
                <img
                  key={i}
                  src={`https://cdn.uselearnbase.com/${att.key}`}
                  alt="attachment"
                  className="max-h-[100px] max-w-[160px] rounded-lg object-cover"
                />
              ) : null
            )}
          </div>
        )}

        {isUser ? (
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        ) : (
          <MessageResponse className="prose prose-sm dark:prose-invert max-w-none text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            {message.content}
          </MessageResponse>
        )}

        <p
          className={cn(
            "mt-1 text-[10px]",
            isUser ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
        </p>
      </div>

      {isUser && (
        <Avatar className="size-8 shrink-0">
          <AvatarImage src={getAssetUrl(userAvatar ?? null)} alt={userName} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {userName ? getInitials(userName) : <User className="size-3.5" />}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

function ConversationDetailDialog({
  conversationId,
  open,
  onOpenChange,
}: {
  conversationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const { data, isLoading } = useAdminConversation(conversationId!, {
    enabled: !!conversationId,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        {isLoading ? (
          <div className="p-6">
            <DialogTitle className="sr-only">
              {t("conversations.admin.viewer.title")}
            </DialogTitle>
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="size-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-3",
                    i % 2 === 0 ? "justify-end" : "justify-start"
                  )}
                >
                  <Skeleton className="size-8 rounded-full" />
                  <Skeleton className="h-16 w-[60%] rounded-2xl" />
                </div>
              ))}
            </div>
          </div>
        ) : !data ? (
          <div className="p-6">
            <DialogHeader>
              <DialogTitle>{t("conversations.admin.viewer.title")}</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">
                {t("conversations.admin.viewer.noMessages")}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-6 pb-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarImage
                      src={getAssetUrl(data.conversation.user.avatar)}
                      alt={data.conversation.user.name}
                    />
                    <AvatarFallback>
                      {getInitials(data.conversation.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-base font-semibold">
                      {data.conversation.user.name}
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">
                      {data.conversation.user.email}
                    </p>
                  </div>
                </div>
              </div>
              {data.conversation.title && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {data.conversation.title}
                </p>
              )}
            </div>

            <div className="h-[400px] overflow-y-auto p-6">
              <div className="space-y-4">
                {data.messages.length === 0 ? (
                  <p className="text-center text-muted-foreground">
                    {t("conversations.admin.viewer.noMessages")}
                  </p>
                ) : (
                  data.messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      userAvatar={data.conversation.user.avatar}
                      userName={data.conversation.user.name}
                    />
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ConversationsPage() {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const tableState = useDataTableState({
    defaultSort: { field: "createdAt", order: "desc" },
  });

  const { data, isLoading } = useAdminConversationsList({
    page: tableState.serverParams.page,
    limit: tableState.serverParams.limit,
    search: tableState.serverParams.search,
    sort: tableState.serverParams.sort,
    createdAt: tableState.serverParams.createdAt,
    userId: tableState.serverParams.userId,
    courseId: tableState.serverParams.courseId,
  });

  const filterFields = useMemo<FilterFieldConfig[]>(
    () => [
      {
        key: "createdAt",
        label: t("conversations.admin.filters.createdAt"),
        type: "daterange",
        icon: <Calendar className="size-3.5" />,
      },
    ],
    [t]
  );

  const columns: ColumnDef<AdminConversation>[] = useMemo(
    () => [
      {
        accessorKey: "user",
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title={t("conversations.admin.columns.user")}
          />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Avatar className="size-8">
              <AvatarImage
                src={getAssetUrl(row.original.user.avatar)}
                alt={row.original.user.name}
              />
              <AvatarFallback className="text-xs">
                {getInitials(row.original.user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {row.original.user.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {row.original.user.email}
              </p>
            </div>
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "title",
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title={t("conversations.admin.columns.title")}
          />
        ),
        cell: ({ row }) => (
          <span className="max-w-[200px] truncate">
            {row.original.title ||
              row.original.metadata?.courseTitle ||
              "..."}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "messageCount",
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title={t("conversations.admin.columns.messages")}
          />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.messageCount}</span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title={t("conversations.admin.columns.createdAt")}
          />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDistanceToNow(new Date(row.original.createdAt), {
              addSuffix: true,
            })}
          </span>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedId(row.original.id)}
          >
            <Eye className="size-4" />
          </Button>
        ),
      },
    ],
    [t]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("conversations.admin.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("conversations.admin.description")}
        </p>
      </div>

      <AnalyticsCards />

      <DataTable
        columns={columns}
        data={data?.conversations ?? []}
        isLoading={isLoading}
        pagination={data?.pagination}
        tableState={tableState}
        filterFields={filterFields}
      />

      <ConversationDetailDialog
        conversationId={selectedId}
        open={!!selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </div>
  );
}
