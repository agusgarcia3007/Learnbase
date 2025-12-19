import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Ellipsis, Plus, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@learnbase/ui";
import { Card, CardTable } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@learnbase/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@learnbase/ui";
import { Skeleton } from "@learnbase/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useQuizQuestions,
  useCreateQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
  type Question,
  type CreateQuestionRequest,
  type UpdateQuestionRequest,
} from "@/services/quizzes";
import { QuestionFormDialog } from "./question-form-dialog";
import { AIGenerateDialog } from "./ai-generate-dialog";

type QuizBuilderProps = {
  quizId: string;
};

export function QuizBuilder({ quizId }: QuizBuilderProps) {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const { data, isLoading } = useQuizQuestions(quizId);
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();
  const deleteQuestion = useDeleteQuestion();

  const questions = data?.questions || [];

  const handleCreateQuestion = (payload: CreateQuestionRequest) => {
    createQuestion.mutate(
      { quizId, ...payload },
      {
        onSuccess: () => {
          setDialogOpen(false);
        },
      }
    );
  };

  const handleUpdateQuestion = (payload: UpdateQuestionRequest) => {
    if (!editingQuestion) return;
    updateQuestion.mutate(
      { questionId: editingQuestion.id, quizId, ...payload },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setEditingQuestion(null);
        },
      }
    );
  };

  const handleDeleteQuestion = (questionId: string) => {
    deleteQuestion.mutate({ questionId, quizId });
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingQuestion(null);
  };

  const columns = useMemo<ColumnDef<Question>[]>(
    () => [
      {
        id: "order",
        header: "#",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.index + 1}</span>
        ),
        size: 50,
      },
      {
        accessorKey: "questionText",
        header: t("quizzes.fields.questionText"),
        cell: ({ row }) => (
          <div className="max-w-md truncate">{row.original.questionText}</div>
        ),
      },
      {
        accessorKey: "type",
        header: t("quizzes.fields.type"),
        cell: ({ row }) => (
          <Badge variant="secondary" size="sm">
            {t(`quizzes.types.${row.original.type}`)}
          </Badge>
        ),
        size: 150,
      },
      {
        id: "options",
        header: t("quizzes.fields.options"),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {t("quizzes.optionsCount", { count: row.original.options.length })}
          </span>
        ),
        size: 120,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="size-7" mode="icon" variant="ghost">
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end">
              <DropdownMenuItem onClick={() => handleEdit(row.original)}>
                {t("common.edit")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => handleDeleteQuestion(row.original.id)}
              >
                {t("common.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        size: 50,
      },
    ],
    [t]
  );

  const table = useReactTable({
    data: questions,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>{t("quizzes.fields.questionText")}</TableHead>
                <TableHead className="w-36">{t("quizzes.fields.type")}</TableHead>
                <TableHead className="w-28">{t("quizzes.fields.options")}</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3].map((i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-7 w-7" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{t("quizzes.builder.title")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("quizzes.builder.description", { count: questions.length })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setAiDialogOpen(true)}>
            <Sparkles className="mr-2 size-4" />
            {t("quizzes.ai.generate")}
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 size-4" />
            {t("quizzes.question.add")}
          </Button>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">{t("quizzes.builder.empty")}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="mr-2 size-4" />
            {t("quizzes.question.addFirst")}
          </Button>
        </div>
      ) : (
        <Card>
          <CardTable>
            <ScrollArea>
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>
        </Card>
      )}

      <QuestionFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        question={editingQuestion}
        onSubmit={(data) => {
          if (editingQuestion) {
            handleUpdateQuestion(data as UpdateQuestionRequest);
          } else {
            handleCreateQuestion(data as CreateQuestionRequest);
          }
        }}
        isPending={createQuestion.isPending || updateQuestion.isPending}
      />

      <AIGenerateDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        quizId={quizId}
      />
    </div>
  );
}
