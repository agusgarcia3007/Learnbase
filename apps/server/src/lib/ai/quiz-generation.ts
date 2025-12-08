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
  let prompt = QUIZ_GENERATION_PROMPT.replace("{{count}}", String(count)).replace(
    "{{content}}",
    content
  );

  if (existingQuestions && existingQuestions.length > 0) {
    const existingList = existingQuestions
      .map((q, i) => `${i + 1}. ${q}`)
      .join("\n");
    prompt = prompt.replace("{{existing_questions}}", existingList);
  } else {
    prompt = prompt.replace("{{existing_questions}}", "None");
  }

  return prompt;
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
