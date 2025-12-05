import type { Question } from "@/services/quizzes";
import { QuestionCard } from "./question-card";

type QuestionListProps = {
  questions: Question[];
  quizId: string;
  onEdit: (question: Question) => void;
  onDelete: (questionId: string) => void;
  onReorder: (questionIds: string[]) => void;
};

export function QuestionList({
  questions,
  quizId,
  onEdit,
  onDelete,
}: QuestionListProps) {
  return (
    <div className="space-y-3">
      {questions.map((question, index) => (
        <QuestionCard
          key={question.id}
          question={question}
          index={index + 1}
          quizId={quizId}
          onEdit={() => onEdit(question)}
          onDelete={() => onDelete(question.id)}
        />
      ))}
    </div>
  );
}
