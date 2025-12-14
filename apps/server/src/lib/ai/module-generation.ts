export type ModuleContentItem = {
  type: "video" | "document" | "quiz";
  title: string;
  description: string | null;
};

export type GeneratedModuleContent = {
  title: string;
  description: string;
};

export const MODULE_GENERATION_PROMPT = `You are an expert content organizer for an online learning platform.

TASK: Generate a concise module title and description based on the content items provided.

INPUT: A list of content items (videos, documents, quizzes) with their titles and descriptions.

CRITICAL: Respond in the SAME LANGUAGE as the input content. If content is in Spanish, respond in Spanish. If in Portuguese, respond in Portuguese. If in English, respond in English.

OUTPUT REQUIREMENTS:

1. TITLE (max 60 chars):
   - Clear, descriptive module name
   - Captures the main theme/topic of the content
   - Should work well as a section header in a course

2. DESCRIPTION (max 300 chars):
   - Brief overview of what's covered in the module
   - What the student will learn or practice
   - 1-2 sentences maximum

OUTPUT: JSON only, no markdown
{
  "title": "...",
  "description": "..."
}

CONTENT ITEMS:
---
{{content}}
---`;

export function buildModulePrompt(items: ModuleContentItem[]): string {
  const contentList = items
    .map((item, i) => {
      const desc = item.description ? `: ${item.description}` : "";
      return `${i + 1}. [${item.type.toUpperCase()}] ${item.title}${desc}`;
    })
    .join("\n");

  return MODULE_GENERATION_PROMPT.replace("{{content}}", contentList);
}

export function parseGeneratedModule(response: string): GeneratedModuleContent {
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response: no JSON object found");
  }

  const parsed = JSON.parse(jsonMatch[0]) as GeneratedModuleContent;

  if (!parsed.title || !parsed.description) {
    throw new Error("Invalid module format in AI response");
  }

  return {
    title: parsed.title,
    description: parsed.description,
  };
}
