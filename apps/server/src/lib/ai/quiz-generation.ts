export type GeneratedQuestion = {
  type: "multiple_choice" | "multiple_select";
  questionText: string;
  explanation: string;
  options: {
    optionText: string;
    isCorrect: boolean;
  }[];
};

export function buildQuizPromptVariables(
  content: string,
  count: number,
  existingQuestions?: string[]
): { count: string; content: string; existing_questions: string } {
  let existingList = "None";
  if (existingQuestions && existingQuestions.length > 0) {
    existingList = existingQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n");
  }

  return {
    count: String(count),
    content,
    existing_questions: existingList,
  };
}

export function parseGeneratedQuestions(response: string): GeneratedQuestion[] {
  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response: no JSON array found");
  }

  const questions = JSON.parse(jsonMatch[0]) as GeneratedQuestion[];

  for (const q of questions) {
    if (!q.type || !q.questionText || !q.options || q.options.length !== 4) {
      throw new Error("Invalid question format in AI response");
    }
  }

  return questions;
}
