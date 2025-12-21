import { QUIZ_GENERATION_PROMPT } from "./prompts";

export type GeneratedQuestion = {
  type: "multiple_choice" | "multiple_select";
  questionText: string;
  explanation: string;
  options: {
    optionText: string;
    isCorrect: boolean;
  }[];
};

export function buildQuizPrompt(
  content: string,
  count: number,
  existingQuestions?: string[]
): string {
  let existingList = "None";
  if (existingQuestions && existingQuestions.length > 0) {
    existingList = existingQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n");
  }

  return QUIZ_GENERATION_PROMPT
    .replace("{{count}}", String(count))
    .replace("{{content}}", content)
    .replace("{{existing_questions}}", existingList);
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
